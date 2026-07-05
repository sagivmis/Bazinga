import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material"
import App from "./App"
import ElectronGuard from "./components/ElectronGuard"
import "./theme/theme.css"
import "./pages/pages.css"
import "./components/forms/form-layout.css"

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } }
})

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#00e5c3" },
    secondary: { main: "#ff4d8d" },
    background: { default: "#0a0e17", paper: "#111827" },
    success: { main: "#00e5c3" },
    error: { main: "#ff4d8d" }
  },
  typography: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 13
  },
  shape: { borderRadius: 8 },
  components: {
    MuiTextField: {
      defaultProps: { size: "small", variant: "outlined" }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#1a2235"
        },
        notchedOutline: {
          borderColor: "#1e293b"
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: "0.75rem" }
      }
    }
  }
})

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <ElectronGuard>
            <App />
          </ElectronGuard>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
