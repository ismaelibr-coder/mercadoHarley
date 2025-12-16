import React from 'react';
import { Truck, RotateCcw, CreditCard, Barcode } from 'lucide-react';

const InfoBar = () => {
    return (
        <div className="bg-sick-red text-white py-8 border-t border-gray-900">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

                    {/* Item 1 */}
                    <div className="flex items-center justify-center md:justify-start gap-4">
                        <Truck className="w-10 h-10" />
                        <div>
                            <h3 className="font-bold text-lg uppercase">Entrega</h3>
                            <p className="text-sm opacity-90">Enviamos para todo o Brasil</p>
                        </div>
                    </div>

                    {/* Item 2 */}
                    <div className="flex items-center justify-center md:justify-start gap-4">
                        <RotateCcw className="w-10 h-10" />
                        <div>
                            <h3 className="font-bold text-lg uppercase">Troca de Produtos</h3>
                            <p className="text-sm opacity-90">Fale conosco</p>
                        </div>
                    </div>

                    {/* Item 3 */}
                    <div className="flex items-center justify-center md:justify-start gap-4">
                        <CreditCard className="w-10 h-10" />
                        <div>
                            <h3 className="font-bold text-lg uppercase">Até 12x nos cartões</h3>
                            <p className="text-sm opacity-90">Parcele suas compras</p>
                        </div>
                    </div>

                    {/* Item 4 */}
                    <div className="flex items-center justify-center md:justify-start gap-4">
                        <Barcode className="w-10 h-10" />
                        <div>
                            <h3 className="font-bold text-lg uppercase">Boleto</h3>
                            <p className="text-sm opacity-90">Compras no boleto</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default InfoBar;
