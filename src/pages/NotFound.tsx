import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Selo } from "@/components/brand/Selo";
import { usePageTitle } from "@/hooks/usePageTitle";

const NotFound = () => {
  usePageTitle("Página não encontrada");
  return (
    <div className="brand-dark relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink px-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <BrandLogo variant="light" className="relative" />
      <Selo name="erro" className="relative mt-10 h-36 rotate-2" />
      <p className="relative mt-6 eyebrow text-white/40">Erro 404</p>
      <h1 className="relative mt-2 font-sora text-2xl font-bold text-white">Essa página saiu da rota</h1>
      <p className="relative mt-2 max-w-sm font-dm text-sm text-white/60">O endereço pode ter mudado ou o link está incompleto.</p>
      <div className="relative mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">
          Ir para o início
        </Link>
        <Link to="/login" className="btn border-[1.5px] border-white/25 text-white hover:bg-white/10">
          Entrar
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
