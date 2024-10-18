import { RequestHandler } from "express";
import ArchimedeanVendorManifest from "@/static/fixed_responses/getVendorInfo/ArchimedeanVendorManifest.json";
import DeimosEntratiFragmentVendorProductsManifest from "@/static/fixed_responses/getVendorInfo/DeimosEntratiFragmentVendorProductsManifest.json";
import DeimosFishmongerVendorManifest from "@/static/fixed_responses/getVendorInfo/DeimosFishmongerVendorManifest.json";
import DeimosHivemindCommisionsManifestFishmonger from "@/static/fixed_responses/getVendorInfo/DeimosHivemindCommisionsManifestFishmonger.json";
import DeimosHivemindCommisionsManifestPetVendor from "@/static/fixed_responses/getVendorInfo/DeimosHivemindCommisionsManifestPetVendor.json";
import DeimosHivemindCommisionsManifestProspector from "@/static/fixed_responses/getVendorInfo/DeimosHivemindCommisionsManifestProspector.json";
import DeimosHivemindCommisionsManifestTokenVendor from "@/static/fixed_responses/getVendorInfo/DeimosHivemindCommisionsManifestTokenVendor.json";
import DeimosHivemindCommisionsManifestWeaponsmith from "@/static/fixed_responses/getVendorInfo/DeimosHivemindCommisionsManifestWeaponsmith.json";
import DeimosHivemindTokenVendorManifest from "@/static/fixed_responses/getVendorInfo/DeimosHivemindTokenVendorManifest.json";
import DeimosPetVendorManifest from "@/static/fixed_responses/getVendorInfo/DeimosPetVendorManifest.json";
import DeimosProspectorVendorManifest from "@/static/fixed_responses/getVendorInfo/DeimosProspectorVendorManifest.json";
import DuviriAcrithisVendorManifest from "@/static/fixed_responses/getVendorInfo/DuviriAcrithisVendorManifest.json";
import EntratiLabsEntratiLabsCommisionsManifest from "@/static/fixed_responses/getVendorInfo/EntratiLabsEntratiLabsCommisionsManifest.json";
import EntratiLabsEntratiLabVendorManifest from "@/static/fixed_responses/getVendorInfo/EntratiLabsEntratiLabVendorManifest.json";
import HubsIronwakeDondaVendorManifest from "@/static/fixed_responses/getVendorInfo/HubsIronwakeDondaVendorManifest.json";
import HubsRailjackCrewMemberVendorManifest from "@/static/fixed_responses/getVendorInfo/HubsRailjackCrewMemberVendorManifest.json";
import HubsPerrinSequenceWeaponVendorManifest from "@/static/fixed_responses/getVendorInfo/HubsPerrinSequenceWeaponVendorManifest.json";
import MaskSalesmanManifest from "@/static/fixed_responses/getVendorInfo/MaskSalesmanManifest.json";
import OstronFishmongerVendorManifest from "@/static/fixed_responses/getVendorInfo/OstronFishmongerVendorManifest.json";
import OstronProspectorVendorManifest from "@/static/fixed_responses/getVendorInfo/OstronProspectorVendorManifest.json";
import OstronPetVendorManifest from "@/static/fixed_responses/getVendorInfo/OstronPetVendorManifest.json";
import SolarisFishmongerVendorManifest from "@/static/fixed_responses/getVendorInfo/SolarisFishmongerVendorManifest.json";
import SolarisProspectorVendorManifest from "@/static/fixed_responses/getVendorInfo/SolarisProspectorVendorManifest.json";
import SolarisDebtTokenVendorManifest from "@/static/fixed_responses/getVendorInfo/SolarisDebtTokenVendorManifest.json";
import SolarisDebtTokenVendorRepossessionsManifest from "@/static/fixed_responses/getVendorInfo/SolarisDebtTokenVendorRepossessionsManifest.json";
import ZarimanCommisionsManifestArchimedean from "@/static/fixed_responses/getVendorInfo/ZarimanCommisionsManifestArchimedean.json";

export const getVendorInfoController: RequestHandler = (req, res) => {
    switch (req.query.vendor as string) {
        case "/Lotus/Types/Game/VendorManifests/Ostron/FishmongerVendorManifest":
            res.json(OstronFishmongerVendorManifest);
            break;

        case "/Lotus/Types/Game/VendorManifests/Ostron/ProspectorVendorManifest":
            res.json(OstronProspectorVendorManifest);
            break;

        case "/Lotus/Types/Game/VendorManifests/Ostron/PetVendorManifest":
            res.json(OstronPetVendorManifest);
            break;

        case "/Lotus/Types/Game/VendorManifests/Ostron/MaskSalesmanManifest":
            res.json(MaskSalesmanManifest);
            break;

        case "/Lotus/Types/Game/VendorManifests/Solaris/FishmongerVendorManifest":
            res.json(SolarisFishmongerVendorManifest);
            break;

        case "/Lotus/Types/Game/VendorManifests/Solaris/ProspectorVendorManifest":
            res.json(SolarisProspectorVendorManifest);
            break;

        case "/Lotus/Types/Game/VendorManifests/Solaris/DebtTokenVendorManifest":
            res.json(SolarisDebtTokenVendorManifest);
            break;

        case "/Lotus/Types/Game/VendorManifests/Solaris/DebtTokenVendorRepossessionsManifest":
            res.json(SolarisDebtTokenVendorRepossessionsManifest);
            break;

        case "/Lotus/Types/Game/VendorManifests/Hubs/PerrinSequenceWeaponVendorManifest":
            res.json(HubsPerrinSequenceWeaponVendorManifest);
            break;

        case "/Lotus/Types/Game/VendorManifests/Hubs/RailjackCrewMemberVendorManifest":
            res.json(HubsRailjackCrewMemberVendorManifest);
            break;

        case "/Lotus/Types/Game/VendorManifests/Deimos/HivemindCommisionsManifestWeaponsmith":
            res.json(DeimosHivemindCommisionsManifestWeaponsmith);
            break;

        case "/Lotus/Types/Game/VendorManifests/Deimos/HivemindCommisionsManifestFishmonger":
            res.json(DeimosHivemindCommisionsManifestFishmonger);
            break;

        case "/Lotus/Types/Game/VendorManifests/Deimos/FishmongerVendorManifest":
            res.json(DeimosFishmongerVendorManifest);
            break;

        case "/Lotus/Types/Game/VendorManifests/Deimos/HivemindCommisionsManifestProspector":
            res.json(DeimosHivemindCommisionsManifestProspector);
            break;

        case "/Lotus/Types/Game/VendorManifests/Deimos/ProspectorVendorManifest":
            res.json(DeimosProspectorVendorManifest);
            break;

        case "/Lotus/Types/Game/VendorManifests/Deimos/HivemindCommisionsManifestPetVendor":
            res.json(DeimosHivemindCommisionsManifestPetVendor);
            break;

        case "/Lotus/Types/Game/VendorManifests/Deimos/PetVendorManifest":
            res.json(DeimosPetVendorManifest);
            break;

        case "/Lotus/Types/Game/VendorManifests/Deimos/HivemindCommisionsManifestTokenVendor":
            res.json(DeimosHivemindCommisionsManifestTokenVendor);
            break;

        case "/Lotus/Types/Game/VendorManifests/Deimos/EntratiFragmentVendorProductsManifest":
            res.json(DeimosEntratiFragmentVendorProductsManifest);
            break;

        case "/Lotus/Types/Game/VendorManifests/Deimos/HivemindTokenVendorManifest":
            res.json(DeimosHivemindTokenVendorManifest);
            break;

        case "/Lotus/Types/Game/VendorManifests/Hubs/IronwakeDondaVendorManifest":
            res.json(HubsIronwakeDondaVendorManifest);
            break;

        case "/Lotus/Types/Game/VendorManifests/Zariman/ArchimedeanVendorManifest":
            res.json(ArchimedeanVendorManifest);
            break;

        case "/Lotus/Types/Game/VendorManifests/Duviri/AcrithisVendorManifest":
            res.json(DuviriAcrithisVendorManifest);
            break;

        case "/Lotus/Types/Game/VendorManifests/Zariman/ZarimanCommisionsManifestArchimedean":
            res.json(ZarimanCommisionsManifestArchimedean);
            break;

        case "/Lotus/Types/Game/VendorManifests/EntratiLabs/EntratiLabVendorManifest":
            res.json(EntratiLabsEntratiLabVendorManifest);
            break;

        case "/Lotus/Types/Game/VendorManifests/EntratiLabs/EntratiLabsCommisionsManifest":
            res.json(EntratiLabsEntratiLabsCommisionsManifest);
            break;

        default:
            throw new Error(`Unknown vendor: ${req.query.vendor}`);
    }
};
