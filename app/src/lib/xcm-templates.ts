export interface ParachainDestination {
  id: string;
  name: string;
  paraId: number;
  icon: string;
  description: string;
  messageHex: `0x${string}`;
}

// XCM v5 ClearOrigin: VersionedXcm::V5(Xcm([ClearOrigin]))
// 0x05 = V5, 0x04 = compact vec length 1, 0x0a = ClearOrigin (index 10)
const XCM_V5_CLEAR_ORIGIN: `0x${string}` = "0x05040a";

export const PARACHAIN_DESTINATIONS: ParachainDestination[] = [
  {
    id: "people",
    name: "People Chain",
    paraId: 1004,
    icon: "P",
    description: "Identity and social features for the Polkadot network",
    messageHex: XCM_V5_CLEAR_ORIGIN,
  },
  {
    id: "bridge-hub",
    name: "Bridge Hub",
    paraId: 1002,
    icon: "B",
    description: "Trustless bridges to Ethereum and other ecosystems",
    messageHex: XCM_V5_CLEAR_ORIGIN,
  },
  {
    id: "coretime",
    name: "Coretime",
    paraId: 1005,
    icon: "C",
    description: "Blockspace marketplace for Polkadot core time",
    messageHex: XCM_V5_CLEAR_ORIGIN,
  },
];
