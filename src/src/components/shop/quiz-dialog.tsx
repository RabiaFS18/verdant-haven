import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatRs } from "@/lib/format";
import { quizQuestions, recommendPlant, type QuizAnswers } from "@/lib/quiz";
import { useUi } from "@/lib/ui";

import { ProductImage } from "./product-image";
import { useAddToCart } from "./use-add-to-cart";

export function QuizDialog() {
  const { bind, panel, close } = useUi();
  const addToCart = useAddToCart();
  const [answers, setAnswers] = useState<string[]>([]);

  useEffect(() => {
    if (panel === "quiz") setAnswers([]);
  }, [panel]);

  const step = answers.length;
  const question = quizQuestions[step];
  const result = useMemo(() => {
    if (question) return null;
    const [light, pets, care] = answers;
    return recommendPlant({ light, pets, care } as QuizAnswers);
  }, [question, answers]);

  return (
    <Dialog {...bind("quiz")}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <p className="eyebrow">
            {question
              ? `Plant Match · Question ${step + 1} of ${quizQuestions.length}`
              : "Your Plant Match"}
          </p>
          <DialogTitle className="font-display text-3xl">
            {question ? question.title : (result?.product.name ?? "")}
          </DialogTitle>
          <DialogDescription>
            {question
              ? "Choose the answer that feels most like your home."
              : (result?.product.description ?? "")}
          </DialogDescription>
        </DialogHeader>

        {question ? (
          <>
            <div className="mt-3 grid gap-2">
              {question.options.map((option) => (
                <Button
                  key={option.label}
                  variant="outline"
                  className="h-12 justify-between px-4"
                  onClick={() => setAnswers([...answers, option.value])}
                >
                  {option.label}
                  <ArrowRight />
                </Button>
              ))}
            </div>
            {step > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-fit"
                onClick={() => setAnswers(answers.slice(0, -1))}
              >
                <ArrowLeft /> Back
              </Button>
            )}
          </>
        ) : (
          result && (
            <div className="mt-1">
              <div className="aspect-[2/1] overflow-hidden rounded-md bg-muted">
                <ProductImage product={result.product} />
              </div>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {result.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <Button asChild variant="outline" onClick={close}>
                  <Link to="/products/$slug" params={{ slug: result.product.slug }}>
                    View plant
                  </Link>
                </Button>
                <Button
                  variant="accent"
                  onClick={() => {
                    addToCart(result.product);
                    close();
                  }}
                >
                  Add to cart · {formatRs(result.product.price)}
                </Button>
              </div>
              <Button variant="link" size="sm" className="mt-2 px-0" onClick={() => setAnswers([])}>
                Retake the quiz
              </Button>
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
