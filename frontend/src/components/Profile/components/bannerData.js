import banner1 from "../../../assets/banners/banner_1_fluid_mesh.jpg";
import banner2 from "../../../assets/banners/banner_2_cyber_topography.jpg";
import banner3 from "../../../assets/banners/banner_3_3d_glass_prisms.jpg";
import banner4 from "../../../assets/banners/banner_4_cosmic_nebula.jpg";
import banner5 from "../../../assets/banners/banner_5_sunset_horizon.jpg";
import banner6 from "../../../assets/banners/banner_6_minimal_dev_desk.jpg";
import banner7 from "../../../assets/banners/banner_7_dark_code_matrix.jpg";
import banner8 from "../../../assets/banners/banner_8_carbon_circuit.jpg";
import banner9 from "../../../assets/banners/banner_9_midnight_city_bokeh.jpg";
import banner10 from "../../../assets/banners/banner_10_minimal_architecture.jpg";

export const DEFAULT_BANNER_ID = "banner_5";

export const BANNERS = [
  {
    id: "banner_1",
    name: "Fluid Aurora Mesh",
    category: "Vibrant Gradient",
    image: banner1,
  },
  {
    id: "banner_2",
    name: "Cyber Topography",
    category: "Dark Waveform",
    image: banner2,
  },
  {
    id: "banner_3",
    name: "Glass Prism 3D",
    category: "Refraction Studio",
    image: banner3,
  },
  {
    id: "banner_4",
    name: "Cosmic Nebula",
    category: "Deep Space",
    image: banner4,
  },
  {
    id: "banner_5",
    name: "Sunset Horizon",
    category: "Warm Sunset",
    image: banner5,
  },
  {
    id: "banner_6",
    name: "Minimal Dev Desk",
    category: "Developer Workspace",
    image: banner6,
  },
  {
    id: "banner_7",
    name: "Dark Code Matrix",
    category: "Futuristic Matrix",
    image: banner7,
  },
  {
    id: "banner_8",
    name: "Carbon Circuit",
    category: "Tech & Cyber",
    image: banner8,
  },
  {
    id: "banner_9",
    name: "Midnight Bokeh",
    category: "Urban Nightscape",
    image: banner9,
  },
  {
    id: "banner_10",
    name: "Minimal Architecture",
    category: "Monochrome Concrete",
    image: banner10,
  },
];

export const getBannerById = (id) => {
  if (!id) return BANNERS.find((b) => b.id === DEFAULT_BANNER_ID) || BANNERS[0];
  const found = BANNERS.find((b) => b.id === id);
  return found || BANNERS.find((b) => b.id === DEFAULT_BANNER_ID) || BANNERS[0];
};

// In-memory cache of decoded/loaded banner URLs
export const loadedImageUrls = new Set();

// Preload banners into browser memory to eliminate loading delay on page visits
if (typeof window !== "undefined") {
  BANNERS.forEach((b) => {
    const img = new Image();
    img.src = b.image;
    if (img.complete) {
      loadedImageUrls.add(b.image);
    } else {
      img.onload = () => loadedImageUrls.add(b.image);
    }
  });
}
