import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";

const NameGeneratorForm = () => {
  const [keyword, setKeyword] = useState("");
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateNamesWithAI = async (keyword: string) => {
    const prompt = `Atue como um especialista em branding e naming.
    Crie 10 sugestões de nomes criativos e memoráveis para uma empresa/marca usando a palavra-chave: "${keyword}".
    
    Considere:
    - Nomes curtos e fáceis de lembrar
    - Possibilidade de registro de domínio
    - Sonoridade agradável
    - Potencial para construção de marca
    - Use técnicas como: combinação de palavras, sufixos modernos, prefixos
    
    Retorne apenas os nomes, um por linha, sem explicações adicionais.`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("OPENAI_API_KEY")}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }

      const suggestions = data.choices[0].message.content
        .split("\n")
        .filter((name: string) => name.trim());
      return suggestions;
    } catch (error) {
      console.error("Error generating names:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma palavra-chave",
        variant: "destructive",
      });
      return;
    }

    if (!localStorage.getItem("OPENAI_API_KEY")) {
      const apiKey = prompt("Por favor, insira sua chave da API OpenAI:");
      if (apiKey) {
        localStorage.setItem("OPENAI_API_KEY", apiKey);
      } else {
        toast({
          title: "Erro",
          description: "É necessária uma chave da API OpenAI para continuar",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const names = await generateNamesWithAI(keyword);
      setGeneratedNames(names);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar nomes. Verifique sua chave da API.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (name: string) => {
    navigator.clipboard.writeText(name);
    toast({
      title: "Sucesso!",
      description: "Nome copiado para a área de transferência",
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Palavra-chave do seu negócio</label>
          <Input
            placeholder="Ex: café, tech, pet..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="glass-effect"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          disabled={isLoading}
        >
          {isLoading ? "Gerando sugestões..." : "Gerar Nomes"}
        </Button>
      </form>

      {generatedNames.length > 0 && (
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Sugestões de Nomes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedNames.map((name, index) => (
              <div
                key={index}
                className="glass-effect p-4 rounded-lg flex justify-between items-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="font-medium">{name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(name)}
                  className="hover:bg-white/20"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NameGeneratorForm;
