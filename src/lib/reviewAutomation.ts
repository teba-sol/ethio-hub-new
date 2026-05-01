export const isFestivalCompleteForReview = (festival: any) => {
  const hasCore =
    !!festival?.name_en &&
    !!festival?.name_am &&
    !!festival?.shortDescription_en &&
    !!festival?.shortDescription_am &&
    !!festival?.fullDescription_en &&
    !!festival?.fullDescription_am &&
    !!festival?.startDate &&
    !!festival?.endDate &&
    !!festival?.location?.name_en &&
    !!festival?.location?.name_am;

  const hasHotels = Array.isArray(festival?.hotels) && festival.hotels.length > 0;
  const hasTransport =
    Array.isArray(festival?.transportation) && festival.transportation.length > 0;

  return hasCore && hasHotels && hasTransport;
};

export const isProductCompleteForReview = (product: any) =>
  !!product?.name_en &&
  !!product?.name_am &&
  !!product?.description_en &&
  !!product?.description_am &&
  Number(product?.price) > 0 &&
  Number(product?.stock) >= 0 &&
  !!product?.category &&
  !!product?.deliveryTime &&
  !!product?.shippingFee;
