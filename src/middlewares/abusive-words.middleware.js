// middlewares/abuseFilter.middleware.js

const abusiveWords = [
    "cunt", "nigger", "nigga", "faggot", "fag", "tranny", "retard", "retarded",
    "spic", "chink", "kike", "coon", "paki",

    "motherfucker", "mother fucker", "mfer", "mf", "cocksucker", "cock sucker",
    "dickhead", "dick head", "pussy", "bitch", "bitches", "whore", "hoes", "ho",
    "slut", "fuck", "fucking", "fucked", "fucker", "fuckin", "fck", "shit",
    "shitty", "asshole", "arsehole", "ass hole", "wanker", "twat", "prick",

    "bastard", "dick", "dickwad", "dickface", "bellend", "knob", "knobhead",
    "tosser", "tosspot", "fuckwit", "fucktard", "shithead", "shit head",
    "dipshit", "dumbass", "dumbfuck", "arse", "jackass", "jerkoff", "jerk off",

    "idiot", "stupid", "moron", "dumb", "dumbo", "loser", "pathetic", "virgin",
    "incel", "simp", "cuck", "beta", "soyboy", "snowflake", "karen", "boomer",
    "zoomer", "clown", "🤡", "scumbag", "lowlife", "trash", "garbage", "dogshit",

    "damn", "hell", "screw", "screwed", "suck", "sucks", "sucker", "nutsack",
    "balls", "testicles", "tit", "tits", "boobs", "piss", "pissed", "crap",
    "bullshit", "BS", "ass", "butthole", "butthead"
];

export const abuseFilterMiddleware = (req, res, next) => {
    if (!req.body || typeof req.body !== "object") {
        return next();
    }

    const words = abusiveWords.map(w => w.toLowerCase());

    const containsAbuse = (obj) => {
        for (const key in obj) {
            const value = obj[key];

            if (typeof value === "string") {
                const normalized = value.toLowerCase();

                for (const word of words) {
                    const regex = new RegExp(`\\b${word}\\b`, "i");
                    if (regex.test(normalized)) {
                        return true;
                    }
                }
            }

            if (typeof value === "object" && value !== null) {
                if (containsAbuse(value)) return true;
            }
        }
        return false;
    };

    if (containsAbuse(req.body)) {
        return res.status(400).json({
            success: false,
            message: "Abusive language is not allowed."
        });
    }

    next();
};