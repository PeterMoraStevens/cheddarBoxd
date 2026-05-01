const BASE = "https://openfoodfacts-images.s3.eu-west-3.amazonaws.com/data";

function basePath(barcode: string): string {
  const b = barcode.replace(/\D/g, "").padStart(13, "0");
  return `${BASE}/${b.slice(0, 3)}/${b.slice(3, 6)}/${b.slice(6, 9)}/${b.slice(9)}/1`;
}

export function computeImgUrl(barcode: string): string {
  return `${basePath(barcode)}.jpg`;
}

/** Async wrapper kept for backward compatibility. */
export async function compute_img_url(barcode = "0001234567890"): Promise<string> {
  return basePath(barcode);
}
