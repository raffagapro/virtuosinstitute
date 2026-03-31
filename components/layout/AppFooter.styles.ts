export const appFooterStyles = {
  footer: "bg-[#171717] py-14 text-white",
  grid: "mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 md:grid-cols-3 md:gap-8",
  leftCol: "flex flex-col items-start gap-4",
  middleCol: "flex flex-col items-start gap-4",
  label:
    "font-['Sora',Helvetica,Arial,sans-serif] text-[13px] font-bold uppercase tracking-[1px] text-white/90",
  phoneLink:
    "font-['Open_Sans',Arial,sans-serif] text-[26px] leading-[1.5] text-white transition-colors hover:text-[#FDCC00]",
  address:
    "font-['Open_Sans',Arial,sans-serif] text-[16px] leading-[1.6] text-white/90",
  emailLink:
    "font-['Open_Sans',Arial,sans-serif] text-[26px] leading-[1.5] text-[#2ea3f2] underline transition-colors hover:text-[#2ea3f2] hover:underline",
  socialWrapper: "flex items-center gap-5 pt-1",
  socialLink: "transition-colors hover:text-[#FDCC00]",
  logoCol: "flex items-start justify-start md:justify-center",
  logoImg: "h-auto w-[160px] md:w-[195px]",
} as const;
