"""Árbol Binario de Búsqueda (BST) implementado desde cero, sin librerías externas, para estudiar y defender."""


# ============================ ÁRBOL BINARIO DE BÚSQUEDA ============================
class _Nodo:
    __slots__ = ("key", "val", "left", "right")
    def __init__(self, key, val=None): self.key, self.val, self.left, self.right = key, val, None, None


class BST:
    """Regla: a la izquierda van las claves MENORES, a la derecha las MAYORES. Sin claves repetidas.
    Costo: O(h) por operación, con h = altura (O(log n) si está balanceado, O(n) en el peor caso)."""

    def __init__(self): self.root, self._n = None, 0
    def __len__(self): return self._n
    def __contains__(self, key): return self._buscar(key) is not None

    def insert(self, key, val=None) -> bool:
        """Inserta. Devuelve True si es clave nueva, False si ya existía (actualiza su valor)."""
        if self.root is None: self.root, self._n = _Nodo(key, val), 1; return True
        cur = self.root
        while True:
            if key == cur.key: cur.val = val; return False
            lado = "left" if key < cur.key else "right"
            sig = getattr(cur, lado)
            if sig is None: setattr(cur, lado, _Nodo(key, val)); self._n += 1; return True
            cur = sig

    def _buscar(self, key):
        cur = self.root
        while cur is not None and cur.key != key: cur = cur.left if key < cur.key else cur.right
        return cur
    def get(self, key, default=None):
        n = self._buscar(key); return n.val if n else default

    def delete(self, key) -> bool:
        """Elimina. Tres casos: hoja, un hijo, dos hijos (se reemplaza por el sucesor en orden: el menor del subárbol derecho)."""
        self.root, borrado = self._borrar(self.root, key)
        if borrado: self._n -= 1
        return borrado
    def _borrar(self, n, key):
        if n is None: return None, False
        if key < n.key: n.left, b = self._borrar(n.left, key); return n, b
        if key > n.key: n.right, b = self._borrar(n.right, key); return n, b
        if n.left is None: return n.right, True          # hoja o solo hijo derecho
        if n.right is None: return n.left, True          # solo hijo izquierdo
        suc = n.right
        while suc.left is not None: suc = suc.left       # sucesor en orden
        n.key, n.val = suc.key, suc.val
        n.right, _ = self._borrar(n.right, suc.key); return n, True

    def min(self):
        n = self.root
        while n and n.left: n = n.left
        return (n.key, n.val) if n else None
    def max(self):
        n = self.root
        while n and n.right: n = n.right
        return (n.key, n.val) if n else None

    # --- Recorridos ---
    def inorder(self):
        """Izquierda, raíz, derecha: devuelve las claves ORDENADAS de menor a mayor."""
        out, pila, cur = [], [], self.root
        while pila or cur:
            while cur: pila.append(cur); cur = cur.left
            cur = pila.pop(); out.append((cur.key, cur.val)); cur = cur.right
        return out
    def preorder(self):
        out = []
        def go(n):
            if n: out.append(n.key); go(n.left); go(n.right)
        go(self.root); return out
    def postorder(self):
        out = []
        def go(n):
            if n: go(n.left); go(n.right); out.append(n.key)
        go(self.root); return out

    # --- Consultas que aprovecha la agenda ---
    def floor(self, key):
        """Mayor clave <= key."""
        cur, best = self.root, None
        while cur:
            if cur.key == key: return (cur.key, cur.val)
            if cur.key < key: best, cur = cur, cur.right
            else: cur = cur.left
        return (best.key, best.val) if best else None
    def ceiling(self, key):
        """Menor clave >= key (ej.: 'la primera hora libre desde las 10:00')."""
        cur, best = self.root, None
        while cur:
            if cur.key == key: return (cur.key, cur.val)
            if cur.key > key: best, cur = cur, cur.left
            else: cur = cur.right
        return (best.key, best.val) if best else None
    def range(self, lo, hi): return [(k, v) for k, v in self.inorder() if lo <= k <= hi]
    def height(self):
        def h(n): return 0 if n is None else 1 + max(h(n.left), h(n.right))
        return h(self.root)
