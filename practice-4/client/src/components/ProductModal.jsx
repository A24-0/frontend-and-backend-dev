import React, { useEffect, useState } from 'react';

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantityInStock, setQuantityInStock] = useState('');
  const [rating, setRating] = useState('');

  useEffect(() => {
    if (!open) return;
    const p = initialProduct;
    setName(p?.name ?? '');
    setCategory(p?.category ?? '');
    setDescription(p?.description ?? '');
    setPrice(p?.price != null ? String(p.price) : '');
    setQuantityInStock(p?.quantityInStock != null ? String(p.quantityInStock) : '');
    setRating(p?.rating != null ? String(p.rating) : '');
  }, [open, initialProduct]);

  if (!open) return null;

  const title = mode === 'edit' ? 'Редактирование товара' : 'Добавление товара';

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const numPrice = Number(price);
    const numQty = quantityInStock === '' ? 0 : Number(quantityInStock);
    const numRating = rating === '' ? null : Number(rating);
    if (!trimmedName) {
      alert('Введите название');
      return;
    }
    if (!Number.isFinite(numPrice) || numPrice < 0) {
      alert('Введите корректную цену');
      return;
    }
    onSubmit({
      id: initialProduct?.id,
      name: trimmedName,
      category: category.trim(),
      description: description.trim(),
      price: numPrice,
      quantityInStock: Math.max(0, numQty),
      rating: numRating,
    });
  };

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal__header">
          <div className="modal__title">{title}</div>
          <button type="button" className="iconBtn" onClick={onClose} aria-label="Закрыть">✕</button>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Название
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Название товара" required />
          </label>
          <label className="label">
            Категория
            <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Категория" />
          </label>
          <label className="label">
            Описание
            <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание" />
          </label>
          <label className="label">
            Цена
            <input className="input" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Цена" required />
          </label>
          <label className="label">
            Количество на складе
            <input className="input" type="number" min="0" value={quantityInStock} onChange={(e) => setQuantityInStock(e.target.value)} placeholder="0" />
          </label>
          <label className="label">
            Рейтинг (опц.)
            <input className="input" type="number" min="0" max="5" step="0.1" value={rating} onChange={(e) => setRating(e.target.value)} placeholder="0–5" />
          </label>
          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn--primary">{mode === 'edit' ? 'Сохранить' : 'Добавить'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
