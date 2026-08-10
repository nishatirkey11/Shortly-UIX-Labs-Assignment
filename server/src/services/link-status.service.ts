export function getLinkStatus(link: {
  disabled: boolean;
  clickCap: number | null;
  clickCount: number;
}) {
  if (link.disabled) {
    return "Disabled";
  }

  if (
    link.clickCap !== null &&
    link.clickCount >= link.clickCap
  ) {
    return "Capped";
  }

  return "Active";
}