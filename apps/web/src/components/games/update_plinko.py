import os

file_path = r'c:\Users\novra\Desktop\vladfsBET\apps\web\src\components\games\update_plinko.py'

def update_game_file():
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update the Refs block
    # We look for the block containing ballsRef, pegsRef, layoutRef, and animIdRef
    # and insert particlesRef and shockwavesRef.
    
    # Target block to replace:
    old_refs_block = """
  const ballsRef = useRef<Ball[]>([]);
  const pegsRef = useRef<Peg[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const layoutRef = useRef<BoardLayout>(plinkoLayout(680, 520, 16));
  const animIdRef = useRef<number | null>(null);
"""
    
    if old_refs_block in content:
        new_refs_block = """
  const ballsRef = useRef<Ball[]>([]);
  const pegsRef = useRef<Peg[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const layoutRef = useRef<BoardLayout>(plinkoLayout(680, 520, 16));
  const animIdRef = useRef<number | null>(null);
"""
        content = content.replace(old_refs_block, new_refs_block)
    else:
        # Manual construction if exact block fails due to whitespace/newlines
        lines = content.splitlines()
        found = False
        for i, line in enumerate(lines):
            if "const ballsRef = useRef<Ball[]>([]);" in line:
                # Insert particlesRef and shockwavesRef after pegsRef
                # We expect pegsRef to be at i+1
                lines.insert(i+2, "  const particlesRef = useRef<Particle[]>([]);")
                lines.insert(i+3, "  const shockwavesRef = useRef<Shockwave[]>([]);")
                # Shift layoutRef and animIdRef down
                found = True
                break
        content = "\n".join(lines)

    # 2. Add Helper Functions
    # Insert them after the multipliers declaration
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
    
    if "const multipliers = getPlinkoMultipliers(rows, risk);

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
" in content:
        content = content.replace(
            "const multipliers = getPlinkoMultipliers(rows, risk);

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
",
            f"const multipliers = getPlinkoMultipliers(rows, risk);

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
\n{helpers}"
        )

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully updated the file.")

if __name__ == "__main__":
    update_game_file()
