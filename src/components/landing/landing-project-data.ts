export type LandingProject = {
  slug: string;
  title: string;
  division: string;
  description: string;
  visual: "environment" | "robotics" | "agriculture";
};

// Placeholder content for the portfolio UI. Replace it with documented RESTEX projects.
export const LANDING_PROJECTS: LandingProject[] = [
  {
    slug: "pemantauan-kualitas-ruang",
    title: "Pemantauan kualitas ruang",
    division: "Wiring & Electrical",
    description:
      "Contoh konsep pemantauan kondisi ruang dengan sensor dan visualisasi data.",
    visual: "environment",
  },
  {
    slug: "robot-navigasi-mandiri",
    title: "Robot navigasi mandiri",
    division: "Programming",
    description:
      "Contoh konsep robot yang membaca lingkungan dan menentukan arah gerak.",
    visual: "robotics",
  },
  {
    slug: "kebun-pintar",
    title: "Kebun pintar berbasis sensor",
    division: "Research",
    description:
      "Contoh konsep pemantauan kelembapan untuk membantu perawatan tanaman.",
    visual: "agriculture",
  },
];
