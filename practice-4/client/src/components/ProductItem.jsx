import React from 'react';

export default function ProductItem({ product, onEdit, onDelete }) {
  return (
    <div className="productRow">
      <div className="productMain">
        <div className="productId">#{product.id}</div>
        <div className="productName">{product.name}</div>
        <div className="productCategory">{product.category}</div>
        <div className="productDesc">{product.description}</div>
        <div className="productMeta">
          {product.price != null && <span>{Number(product.price).toLocaleString('ru-RU')} ₽</span>}
          {product.quantityInStock != null && <span>На складе: {product.quantityInStock}</span>}
          {product.rating != null && <span>★ {product.rating}</span>}
        </div>
      </div>
      <div className="productActions">
        <button className="btn" onClick={() => onEdit(product)}>Редактировать</button>
        <button className="btn btn--danger" onClick={() => onDelete(product.id)}>Удалить</button>
      </div>
    </div>
  );
}
