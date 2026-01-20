import "../../style/halloween-bg.css"



const BAT_COUNT = 40;
const rnd = (a: number, b: number) => Math.random() * (b - a) + a;

export default function HalloweenBackground() {
  return (
    <div className="halloween-bg">
      
      {/* Lune */}
      <div className="moon" />

      {/* Chauves-souris */}
      {Array.from({ length: BAT_COUNT }).map((_, i) => {
        const fromLeft = Math.random() < 0.5;

        const startX = fromLeft ? "-15vw" : "115vw";
        const endX   = fromLeft ? "115vw"  : "-15vw";

        // On permet aux bats de naître parfois hors-écran en Y
        const startY = `${rnd(-10, 110)}vh`;
        const deltaY = `${rnd(-40, 40)}vh`;

        const scaleStart = rnd(0.7, 1.25);
        const scaleEnd   = scaleStart + rnd(-0.1, 0.15);

        const duration = `${rnd(12, 22)}s`;
        const delay    = `${-rnd(0, 10)}s`;

        // Légère variation d’opacité pour simuler la profondeur
        const opacity  = rnd(0.65, 0.95);

        return (
          <div
            key={i}
            className="bat"
            style={
              {
                "--start-x": startX,
                "--end-x": endX,
                "--start-y": startY,
                "--delta-y": deltaY,
                "--scale": scaleStart.toString(),
                "--scale-end": scaleEnd.toString(),
                animationDuration: `${duration}, 0.6s`,
                animationDelay: `${delay}, 0s`,
                opacity,
              } as React.CSSProperties
            }
          >
            {/* Silhouette SVG de chauve-souris */}
            <svg
              className="bat-shape"
              viewBox="0 0 200 100"
              width="64"
              height="32"
              aria-hidden
            >
              {/* Aile gauche */}
              <path
                className="wing wing-left"
                d="
                  M 100 50
                  C 80 20, 45 10, 20 25
                  C 32 35, 40 45, 30 55
                  C 45 58, 60 62, 70 70
                  C 78 76, 88 80, 100 78
                  Z
                "
                fill="currentColor"
              />
              {/* Aile droite (symétrique) */}
              <path
                className="wing wing-right"
                d="
                  M 100 50
                  C 120 20, 155 10, 180 25
                  C 168 35, 160 45, 170 55
                  C 155 58, 140 62, 130 70
                  C 122 76, 112 80, 100 78
                  Z
                "
                fill="currentColor"
              />
              {/* Corps + tête */}
              <path
                className="body"
                d="
                  M 92 50
                  C 90 40, 95 32, 100 32
                  C 105 32, 110 40, 108 50
                  C 108 65, 92 65, 92 50 Z
                "
                fill="currentColor"
              />
              {/* Oreilles (petits triangles) */}
              <path
                d="M 96 32 L 93 28 L 96 30 Z"
                fill="currentColor"
              />
              <path
                d="M 104 32 L 107 28 L 104 30 Z"
                fill="currentColor"
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
}
