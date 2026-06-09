import { Providers } from "./providers";
import { AppRouter } from "./router";
import "./styles/global.css";

export function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  );
}
