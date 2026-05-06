import { initCronJobs } from "../services/cron/scheduler.service.js";

export default function startCronJobs() {
  initCronJobs();
}