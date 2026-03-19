import React from "react";

const data = [
  { id: 1, nombre: "EDHER", dio: true, detalle: "Edher Barreto" },
  { id: 2, nombre: "JUHAN", dio: true, detalle: "Juhan Bazán Agreda" },
  { id: 3, nombre: "GADDIEL", dio: true, detalle: "Gaddiel Caballero" },
  { id: 4, nombre: "LIAM", dio: true, detalle: "Calderón Liam" },
  { id: 5, nombre: "EXUM", dio: true, detalle: "Exum Nuran Carhuapoma Guevara" },
  { id: 6, nombre: "RODRIGO", dio: true, detalle: "Rodrigo Cuchuyrumi" },
  { id: 7, nombre: "LUCIANO", dio: true, detalle: "Abdiel Luciano González Franco" },
  { id: 8, nombre: "EVANS", dio: false, detalle: "" },
  { id: 9, nombre: "ARLET", dio: false, detalle: "" },
  { id: 10, nombre: "IVANA", dio: true, detalle: "Ivana Huaycochea" },
  { id: 11, nombre: "JERENIS", dio: true, detalle: "Jerenis Lucero Mamani" },
  { id: 12, nombre: "VICTORIA", dio: false, detalle: "" },
  { id: 13, nombre: "MATEO", dio: false, detalle: "" },
  { id: 14, nombre: "AIRAM", dio: true, detalle: "Airam Monsalve" },
  { id: 15, nombre: "FABIO", dio: false, detalle: "" },
  { id: 16, nombre: "BENJAMIN", dio: true, detalle: "Benjamín Pupuche" },
  { id: 17, nombre: "LUKAS", dio: true, detalle: "Lukas Rodriguez" },
  { id: 18, nombre: "ABRIL", dio: true, detalle: "Abril Yauri Quezada" },
  { id: 19, nombre: "VALENTINO", dio: true, detalle: "Valentino Yzaguirre Murillo" },
  { id: 20, nombre: "ISAAC", dio: true, detalle: "Isaac Rodriguez" },
];

export default function TablaComparativa() {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-2xl p-6">
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          📊 Control de Entregas
        </h1>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200 text-gray-700 text-sm uppercase">
              <th className="p-3 text-left">N°</th>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-center">Estado</th>
              <th className="p-3 text-left">Detalle</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item) => (
              <tr
                key={item.id}
                className="border-b hover:bg-gray-50 transition"
              >
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
              </tr>
            ))}
          </tbody>
        </table>

        {/* Resumen */}
        <div className="mt-6 flex justify-between text-sm font-semibold">
          <span className="text-green-600">
            ✅ Entregaron: {data.filter(d => d.dio).length}
          </span>
          <span className="text-red-600">
            ❌ Faltan: {data.filter(d => !d.dio).length}
          </span>
        </div>

      </div>
    </div>
  );
}