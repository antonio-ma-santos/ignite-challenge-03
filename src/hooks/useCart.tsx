import { createContext, ReactNode, useContext, useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

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
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const cartPrevRef = useRef<Product[]>();

  useEffect(() => {
    cartPrevRef.current = cart;
  });

  const cartPreviousValue = cartPrevRef.current ?? cart;

  useEffect(() => {
    if (cartPreviousValue !== cart) {
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    }
  }, [cart, cartPreviousValue]);

  const addProduct = async (productId: number) => {
    try {
      const cartUpdated = [...cart];
      const productExists = cartUpdated.find((product) => product.id === productId);

      const response = await api.get(`stock/${productId}`);

      const stockAmount = response.data.amount;
      const currentAmount = productExists ? productExists.amount : 0;
      const amountUpdate = currentAmount + 1;

      if (amountUpdate > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExists) {
        productExists.amount = amountUpdate;
      }else {
        const response = await api.get(`products/${productId}`);

        const newProduct = {
          ...response.data,
          amount: 1
        } 
        cartUpdated.push(newProduct);
      }
      setCart(cartUpdated);

      // const cartTemp = cart;
      
      // const response = await api.get(`stock/${productId}`);

      // const productInStock: Stock = response.data;
      
      // const productAddedCart = cartTemp.findIndex((product) => product.id === productId);

      // if (productAddedCart !== -1) {
      //   if (productInStock.amount > cartTemp[productAddedCart].amount) {
      //     cartTemp[productAddedCart].amount++; 
      //   }else {
      //     toast.error('Quantidade solicitada fora de estoque');
      //     return;
      //   }
      // }else {
      //   const response = await api.get(`products/${productId}`);

      //   const product: Product = response.data;

      //   product.amount = 1;

      //   cartTemp.push(product);
      // }
      // setCart(cartTemp);

      // localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try { 
      const oldCart = [...cart];

      const productExists = oldCart.find((product) => product.id === productId);

      if (productExists) {
        const newCart = oldCart.filter((product) => product.id !== productId);
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }else {
        throw Error();
      }

      // const productAddedCart = cart.find((product) => product.id === productId);

      // if (productAddedCart) {
      //   const newCart = cart.filter((product) => product.id !== productId);
      //   setCart(newCart);
      //   localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      // }else {
      //   toast.error('Erro na remoção do produto');
      //   return;
      // }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }
      const response = await api.get(`stock/${productId}`);
      const amountInStock = response.data.amount;
     
      if (amount > amountInStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      const cartUpdated = [...cart];
      const productExists = cartUpdated.find((product) => product.id === productId);

      if (productExists) {
        productExists.amount = amount;
        setCart(cartUpdated);
      }else {
        throw Error();
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
