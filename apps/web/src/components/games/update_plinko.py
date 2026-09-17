import os

file_path = r'c:\Users\novra\Desktop\vladfsBET\apps\web\src\components\games\plinko-game.tsx'

def replace_content():
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update Refs
    old_refs = """
  const ballsRef = useRef<Ball[]>([]);
  const pegsRef = useRef<Peg[]>([]);
  const layoutRef = useRef<BoardLayout>(plinkoLayout(680, 520, 16));
  const animIdRef = useRef<number | null>(null);
"""
    new_refs = """
  const ballsRef = useRef<Ball[]>([]);
  const pegsRef = useRef<Peg[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const layoutRef = useRef<BoardLayout>(plinkoLayout(680, 520, 16));
  const animIdRef = useRef<number | null>(null);
"""
    
    if old_refs in content:
        content = content.replace(old_refs, new_refs)
    else:
        # Try to find it with slightly different spacing/newlines if needed
        # This is a fallback but usually not needed if the content matches exactly
        pass

    # 2. Add Helper Functions (before toggleMute)
    # We'll look for the line 'const multipliers = getPlinkoMultipliers(rows, risk);'
    # and insert the functions after it.
    
    helpers = """
  const createParticles = (x: number, y: number, count: number, color: string) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 1.0,
        color,
        size: Math.random() * 3 + 1,
      });
    }
  };

  const createShockwave = (x: number, y: number) => {
    shockwavesRef.current.push({
      x,
      y,
      radius: 0,
      maxRadius: 40,
      life: 1.0,
    });
  };
"""
    
    if "const multipliers = getPlinkoMultipliers(rows, risk);" in content:
        content = content.replace(
            "const multipliers = getPlinkoMultipliers(rows, risk);",
            f"const multipliers = getPlinkoMultipliers(rows, risk);\n{helpers}"
        )

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success: File updated.")

if __name__ == "__main__":
    replace_content()
