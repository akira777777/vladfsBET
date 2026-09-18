import os

file_path = r'c:\Users\novra\Desktop\vladfsBET\apps\web\src\components\games\plinko-game.tsx'

def update_game_file():
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update Ball Interface
    ball_interface = """
interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  targetBin: number;
  targetMultiplier: number;
  betAmount: number;
  completed: boolean;
  currentRow: number;
  path: number[];
  step: number;
  trail: { x: number; y: number }[];
  landedAt: number | null;
  isLanding: boolean;
  targetX: number;
  targetY: number;
  progress: number;
}
"""
    
    # Find the start of the Ball interface
    import re
    match = re.search(r'interface Ball \{[^}]*\}', content, re.DOTALL)
    if match:
        content = content.replace(match.group(0), ball_interface)

    # 2. Add Particle and Shockwave Interfaces (if not present)
    if 'interface Particle' not in content:
        particle_interface = """
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}
"""
        # Insert after Ball interface
        content = content.replace(ball_interface, ball_interface + '\n' + particle_interface)

    if 'interface Shockwave' not in content:
        shockwave_interface = """
interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
}
"""
        content = content.replace(ball_interface + '\n' + particle_interface, 
                                  ball_interface + '\n' + particle_interface + '\n' + shockwave_interface)

    # 3. Add Refs and Helpers
    if 'const particlesRef = useRef<Particle[]>' not in content:
        refs_block = """
  const particlesRef = useRef<Particle[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
"""
        # Insert after 'const pegsRef = useRef<Peg[]>([]);'
        content = content.replace('const pegsRef = useRef<Peg[]>([]);', 
                                  'const pegsRef = useRef<Peg[]>([]);' + refs_block)

    if 'const createParticles = (x: number, y: number, count: number, color: string) =>' not in content:
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
        # Insert after 'const multipliers = getPlinkoMultipliers(rows, risk);'
        content = content.replace('const multipliers = getPlinkoMultipliers(rows, risk);',
                                  'const multipliers = getPlinkoMultipliers(rows, risk);' + helpers)

    # 4. Add Physics Update for Particles and Shockwaves
    physics_update = """
  // --- Particle Physics Update ---
  particlesRef.current = particlesRef.current.filter((p) => p.life > 0).map((p) => {
    p.vy += 0.3; // gravity
    p.vx *= 0.98; // friction
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.025; // fade
    return p;
  });

  // --- Shockwave Physics Update ---
  shockwavesRef.current = shockwavesRef.current.filter((sw) => sw.life > 0).map((sw) => {
    sw.radius += (sw.maxRadius - sw.radius) * 0.15;
    sw.life -= 0.04;
    return sw;
  });
"""
    if 'requestAnimationFrame(update)' in content:
        content = content.replace(
            'requestAnimationFrame(update);',
            physics_update + '\n  requestAnimationFrame(update);'
        )
    else:
        # Fallback: insert before the closing brace of the update function or similar
        # We'll just try to insert it if requestAnimationFrame(update) isn't found
        pass

    # 5. Add Rendering for Particles and Shockwaves
    render_code = """
  // --- Render Particles ---
  for (const p of particlesRef.current) {
    ctx.beginPath();
    ctx.fillStyle = p.color + Math.floor(p.life * 255).toString(16).padStart(2, '0');
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Render Shockwaves ---
  for (const sw of shockwavesRef.current) {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(255, 255, 255, ${sw.life * 0.6})`;
    ctx.lineWidth = 2;
    const r = sw.radius;
    ctx.arc(sw.x, sw.y, Math.max(0, r - 2), 0, Math.PI * 2);
    ctx.stroke();
  }
"""
    if 'requestAnimationFrame(draw)' in content:
        content = content.replace(
            'requestAnimationFrame(draw);',
            render_code + '\n  requestAnimationFrame(draw);'
        )
    else:
        # Fallback insertion if requestAnimationFrame(draw) not found
        pass

    # 6. Update Landing Logic (Slide Animation)
    # We'll find the line where ball.y >= layout.binY and add the slide logic
    landing_logic = """
  // --- Landing Slide ---
  if (!ball.completed && !ball.isLanding && ball.y >= layout.binY) {
    ball.isLanding = true;
    ball.currentBinX = layout.startX + ball.targetBin * layout.spacing + (layout.spacing - ball.radius * 2) / 2 + ball.radius;
    ball.currentBinY = layout.binY + layout.binH / 2;
    ball.vx = 0;
    ball.targetX = ball.currentBinX;
    ball.targetY = ball.currentBinY;
    ball.progress = 0;
    createShockwave(ball.x, ball.y);
    createParticles(ball.x, ball.y, 15, '#ffffff');
  }
  
  if (ball.isLanding) {
    ball.progress += 0.05;
    const t = Math.min(ball.progress, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    ball.x = ball.targetX * ease;
    ball.y = ball.targetY * ease;
    if (t >= 1) {
      ball.completed = true;
    }
  }
"""
    
    # We'll insert this *before* the existing 'if (ball.y >= layout.binY)' block
    if "if (ball.y >= layout.binY)" in content:
        idx = content.find("if (ball.y >= layout.binY)")
        if idx != -1:
            content = content[:idx] + landing_logic + content[idx:]

    # 7. Update Collision to use Particles/Shockwaves
    # Find the collision logic: 'if (dist < ball.radius + peg.radius)'
    collision_code = """
    // --- Impact Juice ---
    createParticles(peg.x, peg.y, 5, '#a1b3c4');
    createShockwave(peg.x, peg.y);
"""
    
    if "if (dist < ball.radius + peg.radius)" in content:
        idx = content.find("if (dist < ball.radius + peg.radius)")
        if idx != -1:
            # Find the next line to insert after (assuming it's the start of the collision block)
            # We'll look for the next indentation
            next_line = content.find("\n    ", idx)
            if next_line != -1:
                content = content[:next_line] + collision_code + content[next_line:]

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully updated the file.")

if __name__ == "__main__":
    update_game_file()
