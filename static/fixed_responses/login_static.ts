import { IGroup } from "@/src/types/loginTypes";

export const groups: IGroup[] = [
  {
    experiment: "InitiatePage",
    experimentGroup: "initiate_page_no_video"
  },
  { experiment: "ChatQAChannel", experimentGroup: "control" },
  {
    experiment: "MarketSearchRecommendations",
    experimentGroup: "premium_credit_purchases_14_days"
  },
  { experiment: "SurveyLocation", experimentGroup: "EXIT" },
  { experiment: "GamesightAB", experimentGroup: "a" }
];

export const platformCDNs = [
  "https://content.warframe.com/",
  "https://content-xb1.warframe.com/",
  "https://content-ps4.warframe.com/",
  "https://content-swi.warframe.com/",
  "https://content-mob.warframe.com/"
];

export const Nonce = 1231231233;

export const NRS = ["104.237.145.11", "139.144.69.73", "170.187.231.80", "45.33.58.33", "85.159.214.213"];

export const DTLS = 99;

export const IRC = ["[2001:6e0:202:1026::6667]", "127.0.0.1"];

export const HUB = "https://arbiter.warframe.com/api/";
