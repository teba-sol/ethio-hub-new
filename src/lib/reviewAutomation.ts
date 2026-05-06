export const isFestivalCompleteForReview = (festival: any) => {
  const hasCore =
    (!!festival?.name_en || !!festival?.name_am) &&
    (!!festival?.shortDescription_en || !!festival?.shortDescription_am) &&
    (!!festival?.fullDescription_en || !!festival?.fullDescription_am) &&
    !!festival?.startDate &&
    !!festival?.endDate &&
    (!!festival?.location?.name_en || !!festival?.location?.name_am);

  // Hotels and transportation are now optional for completion review
  return hasCore;
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
