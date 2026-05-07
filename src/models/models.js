import prisma from "../config/prisma.js";

export const User = prisma.user;
export const Otp = prisma.otp;
export const SocialAccount = prisma.socialAccount;
export const SubscriptionTier = prisma.subscriptionTier;
export const UserSubscription = prisma.userSubscription;
export const UserProfile = prisma.userProfile;
export const UserQuota = prisma.userQuota;
export const WaitlistEntry = prisma.waitlistEntry;
export const ClosetItem = prisma.closetItem;
export const ChatSession = prisma.chatSession;
export const ChatMessage = prisma.chatMessage;
export const OutfitSuggestion = prisma.outfitSuggestion;
export const OutfitItem = prisma.outfitItem;
export const OutfitHistory = prisma.outfitHistory;
