import React, { useEffect, useState } from 'react';
import { Sidebar, TopHeader } from './components/Navbar.jsx';
import LoginView from './components/LoginView.jsx';
import MonitorClienteFullscreen from './components/MonitorClienteFullscreen.jsx';
import TabMonitorBiometrico from './components/TabMonitorBiometrico.jsx';
import TabClientesYHuellas from './components/TabClientesYHuellas.jsx';
import TabMembresiasYCongelamientos from './components/TabMembresiasYCongelamientos.jsx';
import TabTurnosCaja from './components/TabTurnosCaja.jsx';
import TabGerenciaAdmin from './components/TabGerenciaAdmin.jsx';
import TabPerfilOperador from './components/TabPerfilOperador.jsx';
import { peticionApi } from './services/api.js';

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const esMonitorCliente =
    params.get('vista') === 'monitor-cliente' ||
    window.location.pathname === '/monitor-cliente';

  const [usuarioActual, setUsuarioActual] = useState(null);
  const [activeTab, setActiveTab] = useState('monitor');
  const [alerta, setAlerta] = useState(null);
  const [turnoAbierto, setTurnoAbierto] = useState(null);
  const [clientePreseleccionadoVenta, setClientePreseleccionadoVenta] = useState(null);

  const consultarTurnoActivo = async () => {
    try {
      const t = await peticionApi('/api/v1/caja/turnos/abierto');
      setTurnoAbierto(t);
    } catch {
      setTurnoAbierto(null);
    }
  };

  useEffect(() => {
    if (usuarioActual) {
      consultarTurnoActivo();
    }
  }, [usuarioActual]);

  if (esMonitorCliente) {
    return <MonitorClienteFullscreen />;
  }

  const mostrarAlerta = (mensaje, tipo = 'ok') => {
    setAlerta({ mensaje, tipo });
    setTimeout(() => setAlerta(null), 5500);
  };

  const handleLogout = () => {
    setUsuarioActual(null);
    setActiveTab('monitor');
  };

  const handleIrAVenderPlan = (cliente) => {
    setClientePreseleccionadoVenta(cliente);
    setActiveTab('membresias');
  };

  if (!usuarioActual) {
    return <LoginView onLoginSuccess={(u) => setUsuarioActual(u)} />;
  }

  return (
    <div className="app-shell">
      <Sidebar
        usuario={usuarioActual}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={handleLogout}
      />

      <div className="workspace">
        <TopHeader
          activeTab={activeTab}
          turnoAbierto={turnoAbierto}
          onIrACaja={() => setActiveTab('caja')}
        />

        <main className="workspace-body">
          {alerta && (
            <div className={`alert-banner ${alerta.tipo}`}>
              <span>{alerta.mensaje}</span>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setAlerta(null)}
              >
                Cerrar
              </button>
            </div>
          )}

          {activeTab === 'monitor' && (
            <TabMonitorBiometrico mostrarAlerta={mostrarAlerta} />
          )}

          {activeTab === 'clientes' && (
            <TabClientesYHuellas
              usuario={usuarioActual}
              mostrarAlerta={mostrarAlerta}
              onIrAVenderPlan={handleIrAVenderPlan}
            />
          )}

          {activeTab === 'membresias' && (
            <TabMembresiasYCongelamientos
              usuario={usuarioActual}
              clientePreseleccionado={clientePreseleccionadoVenta}
              mostrarAlerta={mostrarAlerta}
              onVentaExitosa={consultarTurnoActivo}
            />
          )}

          {activeTab === 'caja' && (
            <TabTurnosCaja
              usuario={usuarioActual}
              mostrarAlerta={mostrarAlerta}
              onCambioEstadoCaja={(t) => setTurnoAbierto(t)}
            />
          )}

          {activeTab === 'admin' && usuarioActual.rol === 'ADMIN' && (
            <TabGerenciaAdmin
              usuario={usuarioActual}
              mostrarAlerta={mostrarAlerta}
            />
          )}

          {activeTab === 'perfil' && (
            <TabPerfilOperador
              usuario={usuarioActual}
              turnoAbierto={turnoAbierto}
              onIrACaja={() => setActiveTab('caja')}
              onIrAGerencia={
                usuarioActual.rol === 'ADMIN' ? () => setActiveTab('admin') : null
              }
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>
    </div>
  );
}
