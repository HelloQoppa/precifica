"use client";
import { useEffect, useRef } from "react";
import { BookOpen, X } from "lucide-react";
import {
  onboardingSteps,
  type OnboardingStep,
} from "../../hooks/useOnboarding";
import { Button } from "../ui/button";

const content: Record<OnboardingStep, { title: string; description: string }> =
  {
    welcome: {
      title: "Vamos conhecer o Precifica?",
      description:
        "Em seis etapas, você vai definir suas metas, entender seus preços e montar uma projeção. Os exemplos já cadastrados podem ser usados. Tudo que você salvar durante o tutorial ficará nos seus dados reais.",
    },
    costs: {
      title: "Defina seus custos e metas",
      description:
        "Revise as despesas mensais, o pró-labore (sua retirada) e a reserva sobre custos fixos. Esses valores formam sua meta mensal. Clique em Salvar custos e metas para avançar.",
    },
    product: {
      title: "Cadastre ou revise um produto",
      description:
        "Clique em Novo produto ou edite um item do catálogo. Informe os insumos usados em uma unidade, seus custos, impostos e margem desejada. Salve para avançar, ou use o cadastro existente.",
    },
    price: {
      title: "Entenda quanto cada venda contribui",
      description:
        "Compare o preço sugerido com o praticado. A contribuição é o que sobra após insumos e taxas para cobrir custos fixos e suas metas. Equilíbrio e meta ideal mostram quantas unidades seriam necessárias vendendo apenas esse produto. Você também pode exportar o catálogo em CSV.",
    },
    simulation: {
      title: "Simule uma negociação",
      description:
        "Escolha um produto, informe quantidade e desconto e confira a contribuição do lote. Mantenha Incluir este pedido no balancete projetado marcado e salve a simulação para avançar. O pedido será salvo no mês atual.",
    },
    result: {
      title: "Confira sua primeira projeção",
      description:
        "Veja como o pedido contribui para cobrir custos fixos, pró-labore e reserva. O resultado após metas mostra o que sobra ou falta. Exporte o CSV para consultar a planilha. Esta é uma projeção, não uma venda realizada.",
    },
  };

export function Onboarding({
  step,
  onGo,
  onPause,
  onFinish,
  onLocate,
  hasProducts,
  storageAvailable,
}: {
  step: OnboardingStep;
  onGo: (step: OnboardingStep) => void;
  onPause: () => void;
  onFinish: () => void;
  onLocate: () => void;
  hasProducts: boolean;
  storageAvailable: boolean;
}) {
  const title = useRef<HTMLHeadingElement>(null);
  const index = onboardingSteps.indexOf(step);
  useEffect(() => {
    title.current?.focus({ preventScroll: true });
    const panel = title.current?.closest("section");
    if (
      panel &&
      (panel.getBoundingClientRect().top < 0 ||
        panel.getBoundingClientRect().top > window.innerHeight / 2)
    ) {
      panel.scrollIntoView({ block: "start" });
    }
  }, [step]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") onPause();
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [onPause]);
  return (
    <section className="onboarding" aria-labelledby="onboarding-title">
      <div className="section-head">
        <span className="onboarding-label">
          <BookOpen size={17} /> Tutorial · Etapa {index + 1} de{" "}
          {onboardingSteps.length}
        </span>
        <button
          type="button"
          className="icon-button"
          onClick={onPause}
          aria-label="Sair do tutorial e continuar depois"
        >
          <X size={19} />
        </button>
      </div>
      <progress
        value={index + 1}
        max={onboardingSteps.length}
        aria-label="Progresso do tutorial"
      />
      <h2 id="onboarding-title" tabIndex={-1} ref={title}>
        {content[step].title}
      </h2>
      <p>{content[step].description}</p>
      {!storageAvailable && (
        <p role="status">
          O navegador não permitiu salvar seu progresso. Você pode continuar
          nesta sessão.
        </p>
      )}
      <div className="onboarding-actions">
        {index > 0 && (
          <Button
            variant="outline"
            onClick={() => onGo(onboardingSteps[index - 1])}
          >
            Voltar
          </Button>
        )}
        {step === "welcome" && (
          <Button onClick={() => onGo("costs")}>Começar</Button>
        )}
        {step !== "welcome" && (
          <Button variant="outline" onClick={onLocate}>
            Ir para esta etapa
          </Button>
        )}
        {step === "product" && hasProducts && (
          <Button onClick={() => onGo("price")}>Usar catálogo existente</Button>
        )}
        {step === "price" && (
          <Button disabled={!hasProducts} onClick={() => onGo("simulation")}>
            Simular um pedido
          </Button>
        )}
        {step === "result" && (
          <Button onClick={onFinish}>Concluir tutorial</Button>
        )}
        <Button variant="ghost" onClick={onPause}>
          Continuar depois
        </Button>
      </div>
    </section>
  );
}
