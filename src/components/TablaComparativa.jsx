import React from "react";

const data = [
  { id: 1, nombre: "EDHER", dio: true, detalle: "Edher fabrizio Barreto Franco", monto: 2.70 },
  { id: 2, nombre: "JUHAN", dio: true, detalle: "Juhan Bazán Agreda", monto: 2.70 },
  { id: 3, nombre: "GADDIEL", dio: true, detalle: "Gaddiel Caballero", monto: 2.70 },
  { id: 4, nombre: "LIAM", dio: true, detalle: "Calderón Liam", monto: 2.70 },
  { id: 5, nombre: "EXUM", dio: true, detalle: "Exum Nuran Carhuapoma Guevara", monto: 2.70 },
  { id: 6, nombre: "RODRIGO", dio: false, detalle: "Rodrigo Cuchuyrumi", monto: 2.70 },
  { id: 7, nombre: "LUCIANO", dio: true, detalle: "Abdiel Luciano González Franco", monto: 2.70 },
  { id: 8, nombre: "EVANS", dio: true, detalle: "Evans Pacheco", monto: 2.70 },
  { id: 9, nombre: "ARLET", dio: true, detalle: "Arlet Naomi Tirado Martinez", monto: 2.70 },
  // { id: 10, nombre: "IVANA", dio: false, detalle: "Ivana Huaycochea", monto: 2.70 },
  { id: 10, nombre: "JERENIS", dio: true, detalle: "Jerenis Lucero Mamani", monto: 2.70 },
  { id: 11, nombre: "VICTORIA", dio: false, detalle: "Victoria Kathalina", monto: 2.70 },
  { id: 12, nombre: "MATEO", dio: true, detalle: "Mateo Melgarejo", monto: 2.70 },
  { id: 13, nombre: "AIRAM", dio: true, detalle: "Airam Monsalve", monto: 2.70 },
  { id: 14, nombre: "FABIO", dio: true, detalle: "Fabio Emir Portocarrero Cabrera", monto: 2.70 },
  { id: 15, nombre: "BENJAMIN", dio: true, detalle: "Benjamín Pupuche", monto: 2.70 },
  { id: 16, nombre: "LUKAS", dio: true, detalle: "Lukas Rodriguez", monto: 2.70 },
  { id: 17, nombre: "ABRIL", dio: false, detalle: "Abril Yauri Quezada", monto: 2.70 },
  { id: 18, nombre: "VALENTINO", dio: true, detalle: "Valentino Yzaguirre Murillo", monto: 2.70 },
  { id: 19, nombre: "ISAAC", dio: true, detalle: "Isaac Rodriguez", monto: 2.70 },
  { id: 20, nombre: "AARON", dio: false, detalle: "Styl Aaron Nicolas Taipe Marquez", monto: 2.70 },
];

export default function TablaComparativa() {

  const total = data.reduce((acc, item) => acc + (item.monto || 0), 0);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-2xl p-6">

        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          📊 Control de Entregas - Portaretrato
        </h1>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200 text-gray-700 text-sm uppercase">
              <th className="p-3 text-left">N°</th>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-center">Estado</th>
              <th className="p-3 text-left">Detalle</th>
              <th className="p-3 text-right">Monto (S/)</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                <td className="p-3">{item.id}</td>

                <td className="p-3 font-medium">{item.nombre}</td>

                <td className="p-3 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      item.dio
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.dio ? "Sí entregó" : "No entregó"}
                  </span>
                </td>

                <td className="p-3 text-gray-600">
                  {item.detalle || "-"}
                </td>

                <td className="p-3 text-right font-semibold">
                  {item.monto ? `S/ ${item.monto.toFixed(2)}` : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Resumen */}
        <div className="mt-6 flex justify-between text-sm font-semibold">
          <span className="text-green-600">
            ✅ Entregaron: {data.filter(d => d.dio).length}
          </span>

          <span className="text-blue-600">
            💰 Total: S/ {total.toFixed(2)}
          </span>

          <span className="text-red-600">
            ❌ Faltan: {data.filter(d => !d.dio).length}
          </span>
        </div>

      </div>
    </div>
  );
}