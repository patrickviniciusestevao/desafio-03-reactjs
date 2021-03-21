import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagesCart = localStorage.getItem('@RocketShoes:cart')

    if (storagesCart) {
      return JSON.parse(storagesCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const findProduct = cart.find(product => product.id === productId);
      
      if(findProduct){
        await updateProductAmount({productId: findProduct.id, amount:(findProduct.amount + 1)})
      }else{
        const { data } = await api.get(`products/${productId}`);
        const updatedCart = [...cart, {...data, amount: 1} ]
        setCart(updatedCart);
    
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const checkProduct = cart.find(product => product.id === productId);
      
      if(checkProduct){
        const filteredProduct = cart.filter(product => product.id !== productId)
      
        setCart(filteredProduct)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteredProduct))
      }else{
        throw new Error()
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount
  }: UpdateProductAmount) => {
    try {
      const { data: stockData } = await api.get(`stock/${productId}`);
      
      if(stockData.amount >= amount && amount > 0){
        const updatedProduct = cart.map(product => {
          if(product.id === productId){
            return { ...product, amount}
          }
          return {...product}
        })
        
        setCart(updatedProduct)
  
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedProduct))
      }else {
        toast.error('Quantidade solicitada fora de estoque');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
