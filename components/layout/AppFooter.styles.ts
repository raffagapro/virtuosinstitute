export const appFooterStyles = {
  footer: "bg-[#171717] py-14 text-white",
  footerCompact: "py-8",
  grid: "mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 md:grid-cols-3 md:gap-8",
  gridCompact: "gap-6 md:gap-6",
  leftCol: "flex flex-col items-start gap-4",
  leftColCompact: "gap-2",
  middleCol: "flex flex-col items-start gap-4",
  middleColCompact: "gap-2",
  label:
    "font-['Sora',Helvetica,Arial,sans-serif] text-[13px] font-bold uppercase tracking-[1px] text-white/90",
  phoneLink:
    "font-['Open_Sans',Arial,sans-serif] text-[26px] leading-[1.5] text-white transition-colors hover:text-[#FDCC00]",
  address:
    "font-['Open_Sans',Arial,sans-serif] text-[16px] leading-[1.6] text-white/90",
  addressCompact: "text-[14px] leading-[1.45]",
  emailLink:
    "font-['Open_Sans',Arial,sans-serif] text-[26px] leading-[1.5] text-[#2ea3f2] underline transition-colors hover:text-[#2ea3f2] hover:underline",
  socialRow: "flex items-center gap-4 pt-1",
  socialRowCompact: "gap-3 pt-0",
  socialWrapper: "flex items-center gap-5 pt-1",
  socialWrapperCompact: "gap-4 pt-0",
  socialLink: "transition-colors hover:text-[#FDCC00]",
  localeSwitcher:
    "inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-sm",
  localeButton:
    "rounded-full px-2.5 py-1 font-['Sora',Helvetica,Arial,sans-serif] text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors duration-200",
  localeButtonActive: "bg-white/12 text-white",
  localeButtonInactive: "text-white/45 hover:text-white/75",
  logoCol: "flex items-start justify-start md:justify-center",
  logoColCompact: "items-center",
  logoImg: "h-auto w-[160px] md:w-[195px]",
  logoImgCompact: "w-[130px] md:w-[160px]",
} as const;
