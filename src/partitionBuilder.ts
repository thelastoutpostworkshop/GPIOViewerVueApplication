import type { ESPPartition } from "@/types/types";

export const PARTITION_BUILDER_URL =
  "https://thelastoutpostworkshop.github.io/ESP32PartitionBuilder/";

const PARTITION_CSV_HEADER = "# Name,Type,SubType,Offset,Size,Flags";

const DATA_SUBTYPE_SLUG: Record<number, string> = {
  0x00: "ota",
  0x01: "phy_init",
  0x02: "nvs",
  0x03: "coredump",
  0x04: "nvs_keys",
  0x05: "efuse_emulation",
  0x06: "undefined",
  0x80: "esphttpd_data",
  0x81: "fat",
  0x82: "spiffs",
  0x83: "littlefs"
};

export function buildPartitionBuilderUrl(partitions: ESPPartition[], flashSizeBytes?: number): string {
  const rows = getBuilderPartitions(partitions);
  if (!rows.length) {
    return PARTITION_BUILDER_URL;
  }

  const flashSizeMB = calculateFlashSizeMB(rows, flashSizeBytes);
  const encoded = encodeCsvAsBase64(buildPartitionCsv(rows));
  const params = new URLSearchParams({
    flash: String(flashSizeMB)
  });
  params.set("partitions", `base64:${encoded}`);
  return `${PARTITION_BUILDER_URL}?${params.toString()}`;
}

export function buildPartitionCsv(partitions: ESPPartition[]): string {
  const lines = getBuilderPartitions(partitions).map(formatPartitionCsvLine);
  return `${PARTITION_CSV_HEADER}\n${lines.join("\n")}`;
}

function formatPartitionCsvLine(partition: ESPPartition): string {
  const name = partition.label?.trim() || "partition";
  const typeSlug = getPartitionTypeSlug(partition);
  const subtypeSlug = getPartitionSubtypeSlug(partition);
  const offset = formatPartitionAddress(partition.address);
  const sizeHex = `0x${partition.size.toString(16).toUpperCase()}`;
  return [escapeCsvValue(name), typeSlug, subtypeSlug, offset, sizeHex, ""].join(",");
}

function getBuilderPartitions(partitions: ESPPartition[]): ESPPartition[] {
  return [...partitions]
    .filter((partition) => partition.size > 0 && !isReservedPartition(partition))
    .sort((left, right) => parsePartitionAddress(left.address) - parsePartitionAddress(right.address));
}

function getPartitionTypeSlug(partition: ESPPartition): string {
  const typeValue = getPartitionTypeValue(partition);
  if (typeValue === 0x00) {
    return "app";
  }
  if (typeValue === 0x01) {
    return "data";
  }
  return `type${formatByteHex(typeValue)}`;
}

function getPartitionSubtypeSlug(partition: ESPPartition): string {
  const typeValue = getPartitionTypeValue(partition);
  const subtypeValue = parsePartitionValue(partition.subtype);

  if (typeValue === 0x00) {
    if (subtypeValue === 0x00) {
      return "factory";
    }
    if (subtypeValue === 0x01) {
      return "test";
    }
    if (subtypeValue >= 0x10 && subtypeValue <= 0x1f) {
      return `ota_${subtypeValue - 0x10}`;
    }
    if (subtypeValue === 0x20) {
      return "any";
    }
    if (subtypeValue === 0x21) {
      return "ota_app";
    }
    return `subtype${formatByteHex(subtypeValue)}`;
  }

  if (typeValue === 0x01) {
    return DATA_SUBTYPE_SLUG[subtypeValue] ?? `subtype${formatByteHex(subtypeValue)}`;
  }

  return `subtype${formatByteHex(subtypeValue)}`;
}

function getPartitionTypeValue(partition: ESPPartition): number {
  if (typeof partition.type === "number" && Number.isFinite(partition.type)) {
    return partition.type;
  }

  const label = partition.label.trim().toLowerCase();
  if (
    label === "factory" ||
    label.startsWith("app") ||
    /^ota[_\d]*$/i.test(partition.label) ||
    (partition.subtype >= 0x10 && partition.subtype <= 0x33)
  ) {
    return 0x00;
  }

  return 0x01;
}

function calculateFlashSizeMB(partitions: ESPPartition[], flashSizeBytes?: number): number {
  const inferredFlashSize = partitions.reduce((maxEnd, partition) => {
    const offset = parsePartitionAddress(partition.address);
    return Math.max(maxEnd, offset + partition.size);
  }, 0);
  const bytes = flashSizeBytes && flashSizeBytes > 0 ? flashSizeBytes : inferredFlashSize;
  if (!bytes) {
    return 1;
  }
  return Math.max(1, Math.round(bytes / (1024 * 1024)));
}

function parsePartitionAddress(address: string): number {
  const parsed = Number.parseInt(address, 16);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPartitionAddress(address: string): string {
  return `0x${parsePartitionAddress(address).toString(16).toUpperCase()}`;
}

function parsePartitionValue(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatByteHex(value: number): string {
  return value.toString(16).padStart(2, "0").toLowerCase();
}

function escapeCsvValue(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return /[",\n]/.test(value) ? `"${escaped}"` : escaped;
}

function encodeCsvAsBase64(value: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(value);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

function isReservedPartition(partition: ESPPartition): boolean {
  const label = partition.label.trim().toLowerCase();
  return label === "bootloader" || label === "partition table";
}
