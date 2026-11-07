const rupees = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });

export const formatRs = (amount: number) => `Rs ${rupees.format(amount)}`;
