import { ArrowLeft, Flame, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function FlamePage() {
  const navigate = useNavigate();

  const handleConnect = () => {
    toast.info("Свяжитесь с администратором для подключения Flame");
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Назад</span>
      </button>

      <div className="bg-card/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 ring-1 ring-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center ring-1 ring-destructive/30">
              <Flame size={24} className="text-destructive" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">Flame</h1>
              <p className="text-sm text-muted-foreground">Эксклюзивный бейдж</p>
            </div>
          </div>
          <button
            onClick={handleConnect}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <Zap size={16} />
            Подключить
          </button>
        </div>

        <div className="space-y-5 text-sm text-foreground/80 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-primary mb-2">Что такое Flame?</h2>
            <p>
              Flame — это эксклюзивный бейдж для самых активных участников нэт.
              Он отображается рядом с вашим именем и показывает ваш статус в сообществе.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary mb-2">Как подключить?</h2>
            <ol className="list-decimal list-inside space-y-2 pl-1">
              <li>Нажмите кнопку <strong>«Подключить»</strong> выше</li>
              <li>Администратор рассмотрит вашу активность</li>
              <li>После одобрения бейдж появится в вашем профиле</li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary mb-2">Что даёт Flame?</h2>
            <ul className="list-disc list-inside space-y-2 pl-1">
              <li>Уникальный огненный значок рядом с именем</li>
              <li>Выделение в ленте и комментариях</li>
              <li>Признание вашего вклада в сообщество</li>
            </ul>
          </section>

          <div className="pt-4 border-t border-border text-center">
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Zap size={16} />
              Подключить Flame
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
