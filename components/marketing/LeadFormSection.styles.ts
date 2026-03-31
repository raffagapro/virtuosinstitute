import { type CSSProperties } from "react";

export const leadFormSectionBackgroundStyle: CSSProperties = {
  backgroundImage:
    "linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.4) 100%), url(https://virtuosinstitute.com.mx/wp-content/uploads/2025/02/lucas-alexander-sJuDgtkUyYs-unsplash.jpg)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
};

export const leadFormSectionStyles = {
  section: "py-20",
  shell: "mx-auto w-full max-w-[1920px] px-6 lg:w-[85%]",
  grid:
    "relative grid grid-cols-1 overflow-hidden rounded-[10px] shadow-[0px_2px_58px_0px_rgba(142,142,142,0.3)] md:grid-cols-3 md:gap-0",
  leftCol: "flex flex-col gap-5 bg-[#FA4361] p-[55px] md:col-span-1",
  leftTitle:
    "w-full border-b-2 border-white/70 pb-4 font-['Sora',Helvetica,Arial,sans-serif] text-[32px] font-bold leading-[1.2] text-white",
  leftInfoRow: "flex items-start gap-3 text-white",
  leftInfoIcon: "mt-1 shrink-0 text-white",
  leftInfoLink:
    "font-['Open_Sans',Arial,sans-serif] text-[18px] leading-[1.5] hover:text-[#FDCC00] transition-colors",
  leftInfoText: "font-['Open_Sans',Arial,sans-serif] text-[18px] leading-[1.5]",
  mapWrap: "overflow-hidden rounded-md border border-white/15",
  rightCol: "bg-white p-[55px] md:col-span-2 md:px-[80px]",
  rightHeading:
    "text-left font-['Sora',Helvetica,Arial,sans-serif] text-[26px] font-bold leading-[1] text-black",
  rightSubtext:
    "mt-[12px] text-left font-['Sora',Helvetica,Arial,sans-serif] text-[15px] leading-[1.8] text-[#999999]",
  success: "mt-6 font-['Sora',sans-serif] text-lg font-bold text-[#FDCC00]",
  form: "mt-7 grid grid-cols-1 gap-4 md:grid-cols-2",
  input:
    "w-full appearance-none rounded-none border-0 bg-[#ededed] px-[25px] py-[15px] font-['Sora',Helvetica,Arial,sans-serif] text-[15px] leading-[1.6] text-black placeholder:text-black focus:outline-none",
  messageInputSpan: "md:col-span-2",
  buttonRow: "md:col-span-2 flex justify-end pt-1",
  button: "text-[14px] hover:!bg-[#FA4361] hover:!text-white",
} as const;
