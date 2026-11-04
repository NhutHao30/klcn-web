/**
 * Utility function to format image URLs flexibly
 * Supports MinIO S3 storage, Proxy API, and local static assets
 */
export const formatImageUrl = (image) => {
  if (!image) return "/assets/IMG/productnew2.webp";
  
  if (typeof image !== 'string') return "/assets/IMG/productnew2.webp";

  const trimmed = image.trim();
  if (!trimmed) return "/assets/IMG/productnew2.webp";

  // If already proxy API
  if (trimmed.startsWith("/api/")) return trimmed;

  // Helper for proxying image with optional visit_id for Kafka tracking
  const toProxyUrl = (targetUrl) => {
    try {
      const visitId = typeof window !== 'undefined' && window.sessionStorage ? sessionStorage.getItem('website_visit_id') : null;
      const params = new URLSearchParams({ url: targetUrl });
      if (visitId) {
        params.set('visit_id', visitId);
      }
      return `/api/proxy-image?${params.toString()}`;
    } catch {
      return `/api/proxy-image?url=${encodeURIComponent(targetUrl)}`;
    }
  };

  // If already full URL with http/https
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    // MinIO storage or HTTP backend IP on Azure -> proxy over HTTPS to avoid Mixed Content
    if (
      trimmed.includes("9000") || 
      trimmed.includes("minio") || 
      trimmed.includes("dolabakery") || 
      trimmed.includes("104.46.218.250")
    ) {
      return toProxyUrl(trimmed);
    }
    return trimmed;
  }

  // MinIO / Storage / Receipts paths
  if (
    trimmed.startsWith("products/") || 
    trimmed.startsWith("news/") || 
    trimmed.startsWith("cccd/") || 
    trimmed.startsWith("storage/") || 
    trimmed.startsWith("/storage/") ||
    trimmed.startsWith("/products/") ||
    trimmed.startsWith("/news/") ||
    trimmed.includes("products/") ||
    trimmed.includes("news/") ||
    trimmed.includes("receipts")
  ) {
    const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    if (cleanPath.startsWith("/assets/receipts/")) {
      return cleanPath;
    }
    return toProxyUrl(cleanPath);
  }

  // Static local assets
  if (trimmed.startsWith("/assets/") || trimmed.startsWith("assets/")) {
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }

  const filename = trimmed.split("/").pop();
  return `/assets/IMG/${filename}`;
};
