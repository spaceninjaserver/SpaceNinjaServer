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

export const DTLS = 99;

export const HUB = "https://arbiter.warframe.com/api/";
