import fs from "fs";
import path from "path";
import si from "systeminformation";
import { fileURLToPath } from "url";

import appConfig from "../config/index.js";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to health.html
const healthHTMLPath = path.join(__dirname, "../templates/health.html");

// ---------- Helpers ----------
function toPercent(n) {
  const v = Math.round(Math.max(0, Math.min(100, n)));
  return Number.isFinite(v) ? v : 0;
}
function bytesToGB(n) {
  return n / 1024 / 1024 / 1024;
}
function classifyStatus({ cpuPct, memPct, diskPct, netUp }) {
  // Simple status policy
  if (cpuPct >= 90 || memPct >= 90 || diskPct >= 95 || !netUp) return "High Load";
  if (cpuPct >= 75 || memPct >= 80 || diskPct >= 90) return "Degraded";
  return "Operational";
}

// ---------- API handler ----------
async function getHealth(req, res) {
  try {
    const [load, mem, disks, time, cpu] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.time(),
      si.cpu(),
    ]);

    // CPU
    const cpuPct = toPercent(load.currentLoad);
    const cpuCores = cpu?.physicalCores || cpu?.cores || undefined;

    // Memory (active memory gives a better "used by apps" signal on Linux; fallback to used)
    const memUsed = mem.active && mem.active > 0 ? mem.active : mem.used;
    const memPct = toPercent((memUsed / mem.total) * 100);

    // Disk: sum all real filesystems (ignore small temp mounts)
    const realDisks = Array.isArray(disks) ? disks.filter((d) => (d.size || 0) > 1e9) : [];
    const totalDisk = realDisks.reduce((a, d) => a + (d.size || 0), 0);
    const usedDisk = realDisks.reduce((a, d) => a + (d.used || 0), 0);
    const diskPct = totalDisk > 0 ? toPercent((usedDisk / totalDisk) * 100) : 0;

    // Network speed (aggregate mbps over all ifaces)
    const nstats = await si.networkStats();
    let aggBytesPerSec = 0;
    let ifaces = 0;
    if (Array.isArray(nstats)) {
      nstats.forEach((n) => {
        if (Number.isFinite(n.rx_sec) || Number.isFinite(n.tx_sec)) {
          aggBytesPerSec += (n.rx_sec || 0) + (n.tx_sec || 0);
          ifaces++;
        }
      });
    }
    const speedMbps = (aggBytesPerSec * 8) / 1_000_000; // megabits per second (SI)
    const netUp = ifaces > 0;
    const status = classifyStatus({ cpuPct, memPct, diskPct, netUp });

    // Placeholder for connections (replace with actual session/socket count)
    const activeConnections = 0; // Static placeholder for clarity

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.json({
      status,
      cpu: cpuPct,
      cpuCores,
      memory: {
        used: memUsed,
        total: mem.total,
        usedGB: Number(bytesToGB(memUsed).toFixed(1)),
        totalGB: Number(bytesToGB(mem.total).toFixed(1)),
        percentage: memPct,
      },
      disk: {
        used: usedDisk,
        total: totalDisk,
        usedGB: Number(bytesToGB(usedDisk).toFixed(1)),
        totalGB: Number(bytesToGB(totalDisk).toFixed(1)),
        percentage: diskPct,
      },
      uptime: {
        raw: Math.max(0, Math.floor(time.uptime || 0)),
        pretty: (() => {
          const s = Math.max(0, Math.floor(time.uptime || 0));
          const days = Math.floor(s / 86400);
          const hours = Math.floor((s % 86400) / 3600);
          const mins = Math.floor((s % 3600) / 60);
          return `${days}d ${hours}h ${mins}m`;
        })(),
      },
      network: {
        status: netUp ? "Stable" : "Unstable",
        speedMbps: Number(speedMbps.toFixed(1)),
        ifaces,
      },
      connections: activeConnections,
    });
  } catch (err) {
    console.error("Error fetching health data:", err);
    res.setHeader("Content-Type", "application/json");
    res.status(500).json({ status: "High Load", message: "Failed to fetch server health" });
  }
}

// ---------- HTML handler ----------
function getHealthPage(req, res) {
  try {
    let htmlContent = fs.readFileSync(healthHTMLPath, "utf8");
    htmlContent = htmlContent.replace("PROJECT_NAME", appConfig.project.name);
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "no-store");
    res.send(htmlContent);
  } catch (err) {
    console.error("Error reading health.html:", err);
    res.status(500).send("Internal Server Error");
  }
}

export { getHealth, getHealthPage };
