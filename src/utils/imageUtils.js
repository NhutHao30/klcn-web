/**
 * Utility function to format image URLs flexibly
 * Supports MinIO S3 storage, Proxy API, and local static assets
 */
export const formatImageUrl = (image) => {
  if (!image) return "/assets/IMG/productnew2.webp";
  
  if (typeof image !== 'string') return "/assets/IMG/productnew2.webp";

  // If already full URL with http/https
  if (image.startsWith("http://") || image.startsWith("https://")) {
    if (image.includes("9000") || image.includes("minio") || image.includes("dolabakery")) {
	//Thêm đoạn này vào để chạy bigdata
	const visitId = sessionStorage.getItem('website_visit_id');
	const params = new URLSearchParams({ url: image });

	if (visitId) {
  	  params.set('visit_id', visitId);
	}

	return `/api/proxy-image?${params.toString()}`;
      //return `/api/proxy-image?url=${encodeURIComponent(image)}`;
    }
    return image;
  }

  // If already proxy API
  if (image.startsWith("/api/")) return image;

  // MinIO / Storage / Receipts paths
  if (
    image.startsWith("products/") || 
    image.startsWith("news/") || 
    image.startsWith("cccd/") || 
    image.startsWith("storage/") || 
    image.startsWith("/storage/") ||
    image.includes("products/") ||
    image.includes("news/") ||
    image.includes("receipts")
  ) {
    const cleanPath = image.startsWith("/") ? image : `/${image}`;
    if (cleanPath.startsWith("/assets/receipts/")) {
      return cleanPath;
    }
    //Thêm vào để chạy bigdata
    const visitId = sessionStorage.getItem('website_visit_id');
    const params = new URLSearchParams({ url: cleanPath });

    if (visitId) {
      params.set('visit_id', visitId);
    }

     return `/api/proxy-image?${params.toString()}`;
    //return `/api/proxy-image?url=${encodeURIComponent(cleanPath)}`;
  }

  // Static local assets
  if (image.startsWith("/assets/") || image.startsWith("assets/")) {
    return image.startsWith("/") ? image : `/${image}`;
  }

  const filename = image.split("/").pop();
  return `/assets/IMG/${filename}`;
};
