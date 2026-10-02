import type { MetadataRoute } from "next";
import { APP } from "@/config/app";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP.name,
    short_name: APP.name,
    description: APP.description,
    start_url: "/app",
    display: "standalone",
    background_color: "#FFF8F2",
    theme_color: "#C93A5B",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
