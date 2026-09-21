export default function Lights() {
  return (
    <>
      {/* Base ambient illumination for plate visibility */}
      <ambientLight intensity={0.5} />

      {/* Primary key light — brings out metallic bevels and textures */}
      <directionalLight position={[4, 5, 4]} intensity={2.2} color="#EDEDF2" />

      {/* Cybernetic edge rim light from rear-left */}
      <directionalLight position={[-5, 3, -2]} intensity={1.8} color="#A3B8FF" />

      {/* Deep indigo core fill */}
      <pointLight position={[-3, -2, -2]} intensity={1.4} color="#6C5CFF" distance={10} decay={2} />

      {/* Electric lime signature rim glow */}
      <pointLight position={[2, -3, 3]} intensity={1.2} color="#B8FF3C" distance={9} decay={2} />
    </>
  )
}
