import { useState } from "react";
import { TrendingUp, TrendingDown, ChevronDown } from "lucide-react";

export default function FilaPadreMovimiento({ p, precioHistorial }) {
    const [padreAbierto, setPadreAbierto] = useState(false); // ← cerrado por defecto
    const [verHistorial, setVerHistorial] = useState(false);

    const alDia = p.monto_pagado >= p.monto_asignado;
    const pendiente = p.monto_asignado - p.monto_pagado;

	const abonos          = p.movimientos.filter((m) => m.tipo === 0 && !m.anulado && m.categoria === 0);
	const cobrosExtra     = p.movimientos.filter((m) => m.tipo === 0 && !m.anulado && m.categoria === 3);
	const abonosAnulados  = p.movimientos.filter((m) => m.tipo === 0 && m.anulado);
	const devoluciones    = p.movimientos.filter((m) => m.tipo === 1 && m.categoria === 3);

	const totalPagado       = abonos.reduce((s, m) => s + m.monto, 0);

    return (
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">

            {/* Cabecera padre — clickeable */}
            <div
                className="flex items-center gap-2 px-4 py-2.5 bg-stone-50 cursor-pointer"
                onClick={() => setPadreAbierto(!padreAbierto)}
            >
                <div className={`w-2 h-2 rounded-full shrink-0 ${alDia ? "bg-emerald-400" : "bg-red-400"}`} />
                <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-xs font-bold text-stone-700 line-clamp-2 wrap-break-word">{p.nombre}</p>
                    <p className="text-[10px] text-stone-400 wrap-break-word">{p.codigo} · {p.hijo} · {p.grado}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0
                    ${alDia ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"}`}>
                    {alDia ? "Al día" : `Debe S/ ${pendiente.toFixed(2)}`}
                </span>
                <div className={`w-7 h-7 flex items-center justify-center rounded-full bg-stone-200 transition-transform duration-200 shrink-0 ${padreAbierto ? "rotate-180" : ""}`}>
                    <ChevronDown size={15} className="text-stone-600" />
                </div>
            </div>

            {/* Contenido — acordión */}
            {padreAbierto && (
                <div className="px-4 py-2">
                    <table className="w-full text-xs">
                        <tbody className="divide-y divide-stone-50">

                            <tr>
                                <td className="py-1.5 text-stone-400">Monto asignado</td>
                                <td className="py-1.5 text-right font-semibold text-stone-600">
                                    S/ {p.monto_asignado.toFixed(2)}
                                </td>
                            </tr>

                            {totalPagado > 0 && (
                                <tr>
                                    <td className="py-1.5 text-stone-400">
                                        <div className="flex items-center gap-1">
                                            <TrendingUp size={10} className="text-emerald-500 shrink-0" />
                                            Pagos realizados
                                        </div>
                                    </td>
                                    <td className="py-1.5 text-right font-semibold text-emerald-600">
                                        +S/ {totalPagado.toFixed(2)}
                                    </td>
                                </tr>
                            )}

							{/* {totalCobrosExtra > 0 && (
								<tr>
									<td className="py-1.5 text-stone-400">
										<div className="flex items-center gap-1">
											<TrendingUp size={10} className="text-orange-400 shrink-0" />
											Cobros adicionales
										</div>
									</td>
									<td className="py-1.5 text-right font-semibold text-orange-500">
										+S/ {totalCobrosExtra.toFixed(2)}
									</td>
								</tr>
							)} */}

                            {/* {totalDevoluciones > 0 && (
                                <tr>
                                    <td className="py-1.5 text-stone-400">
                                        <div className="flex items-center gap-1">
                                            <TrendingDown size={10} className="text-blue-400 shrink-0" />
                                            Devoluciones
                                        </div>
                                    </td>
                                    <td className="py-1.5 text-right font-semibold text-blue-500">
                                        -S/ {totalDevoluciones.toFixed(2)}
                                    </td>
                                </tr>
                            )} */}

                            <tr className="border-t border-stone-200">
                                <td className="pt-2 pb-1.5 font-bold text-stone-600">Saldo pagado</td>
                                <td className="pt-2 pb-1.5 text-right font-black text-stone-700">
                                    S/ {p.monto_pagado.toFixed(2)}
                                </td>
                            </tr>

                            <tr>
                                <td className={`pb-1.5 font-bold ${alDia ? "text-emerald-500" : "text-red-400"}`}>
                                    Pendiente
                                </td>
                                <td className={`pb-1.5 text-right font-black ${alDia ? "text-emerald-600" : "text-red-500"}`}>
                                    {alDia ? "Sin deuda ✓" : `S/ ${pendiente.toFixed(2)}`}
                                </td>
                            </tr>

                        </tbody>
                    </table>

                    {/* Botón historial */}
					{(abonosAnulados.length > 0 || devoluciones.length > 0 || cobrosExtra.length > 0) && (
						<button
							onClick={() => setVerHistorial(!verHistorial)}
							className="w-full text-[10px] text-stone-400 hover:text-amber-500 py-1.5 flex items-center justify-center gap-1 transition-colors"
						>
							{verHistorial ? '▲ Ocultar historial' : '▼ Ver historial completo'}
						</button>
					)}

					{/* Historial completo */}
					{verHistorial && (
						<div className="border-t border-dashed border-stone-100 pt-2 mt-1">
							<p className="text-[10px] text-stone-400 font-bold mb-1.5">Historial completo</p>

							{(() => {
								// Ordenar movimientos cronológicamente
								const movOrdenados = [...p.movimientos]
									.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

								// Construir eras — precio inicial + cada cambio
								const eras = [];

								// Era inicial — antes del primer cambio de precio
								const primerCambio = precioHistorial[0];
								eras.push({
									monto: primerCambio ? primerCambio.monto_anterior : p.monto_asignado,
									hasta: primerCambio ? new Date(primerCambio.fecha) : null,
									label: 'Precio inicial',
								});

								// Una era por cada cambio de precio
								precioHistorial.forEach((h, i) => {
									eras.push({
										monto: h.monto_nuevo,
										desde: new Date(h.fecha),
										hasta: precioHistorial[i + 1] ? new Date(precioHistorial[i + 1].fecha) : null,
										label: `Precio actualizado a S/ ${h.monto_nuevo.toFixed(2)}`,
									});
								});

								return eras.map((era, eraIdx) => {
									// Movimientos que pertenecen a esta era
									const movEra = movOrdenados.filter(m => {
										const fecha = new Date(m.created_at);
										const despuesDe = era.desde ? fecha >= era.desde : true;
										const antesDe   = era.hasta  ? fecha < era.hasta  : true;
										return despuesDe && antesDe;
									});

									if (movEra.length === 0 && eraIdx !== 0) return null;

									return (
										<div key={eraIdx} className="mb-2">
											{/* Header era */}
											<div className="flex items-center gap-2 mb-1">
												<div className="h-px flex-1 bg-stone-100" />
													<span className="text-[9px] font-bold text-stone-400 shrink-0">
														{eraIdx === 0
															? `Precio inicial — S/ ${era.monto.toFixed(2)}`
															: `Precio actualizado — S/ ${precioHistorial[eraIdx-1].monto_anterior.toFixed(2)} → S/ ${era.monto.toFixed(2)}`
														}
													</span>
												<div className="h-px flex-1 bg-stone-100" />
											</div>

											{/* Movimientos de esta era */}
											{movEra.length > 0 ? (
												<table className="w-full text-xs">
													<tbody>
														{movEra.map((m, i) => {
															const esAnulado    = m.anulado;
															const esDevolucion = m.tipo === 1;
															const esCobroExtra = m.tipo === 0 && m.categoria === 3;
															return (
																<tr key={i} className={esAnulado ? 'opacity-60' : ''}>
																	<td className="py-1 text-stone-400">
																		<div className="flex items-center gap-1">
																			{esDevolucion
																				? <TrendingDown size={10} className="text-blue-400 shrink-0" />
																				: <TrendingUp size={10} className={
																					esAnulado ? "text-stone-300 shrink-0"
																					: esCobroExtra ? "text-orange-400 shrink-0"
																					: "text-emerald-500 shrink-0"
																				} />
																			}
																			<span className={esAnulado ? 'line-through text-stone-400' : ''}>
																				{esDevolucion ? 'Devolución' : esCobroExtra ? 'Cobro extra' : 'Pagó'}
																			</span>
																			{esAnulado && (
																				<span className="text-[9px] bg-red-50 text-red-400 px-1.5 py-0.5 rounded font-bold ml-1">
																					anulado
																				</span>
																			)}
																		</div>
																	</td>
																	<td className={`py-1 text-right font-semibold
																		${esAnulado ? 'line-through text-stone-400'
																		: esDevolucion ? 'text-blue-500'
																		: esCobroExtra ? 'text-orange-500'
																		: 'text-emerald-600'}`}>
																		{esDevolucion ? '-' : '+'}S/ {m.monto.toFixed(2)}
																	</td>
																</tr>
															);
														})}
													</tbody>
												</table>
											) : (
												<p className="text-[10px] text-stone-300 text-center py-1">Sin movimientos</p>
											)}
										</div>
									);
								});
							})()}
						</div>
					)}
                </div>
            )}
        </div>
    );
}