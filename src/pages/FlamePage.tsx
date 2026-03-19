import { ArrowLeft, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FlamePage() {
  const navigate = useNavigate();

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
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center ring-1 ring-orange-500/30">
            <Flame size={24} className="text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">Flame</h1>
            <p className="text-sm text-muted-foreground">Эксклюзивный бейдж</p>
          </div>
        </div>

        <div className="space-y-5 text-sm text-foreground/80 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-primary mb-2">Что такое Flame?</h2>
            <p>
              Flame — это особый бейдж, который выделяет активных и преданных участников сообщества.
              Он отображается рядом с вашим именем во всех постах и комментариях.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary mb-2">Как получить Flame?</h2>
            <ol className="list-decimal list-inside space-y-2 pl-1">
              <li>Будьте активным участником сообщества — публикуйте посты, комментируйте, участвуйте в эфирах</li>
              <li>Подпишитесь на наш Telegram-канал и будьте в курсе событий</li>
              <li>Пройдите верификацию через Telegram-бота</li>
              <li>Администратор выдаст вам бейдж Flame за активность</li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary mb-2">Преимущества</h2>
            <ul className="list-disc list-inside space-y-2 pl-1">
              <li>Уникальный значок рядом с именем</li>
              <li>Выделение среди других пользователей</li>
              <li>Признание вашего вклада в сообщество</li>
            </ul>
          </section>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Бейдж выдаётся администрацией. Если вы считаете что заслуживаете Flame — свяжитесь с нами!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
