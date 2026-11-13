import pytest
from app.structures import BST

def arbol():
    t = BST()
    for k in (50, 30, 70, 20, 40, 60, 80): t.insert(k, str(k))
    return t

def test_bst_recorridos_y_busqueda():
    t = arbol()
    assert [k for k, _ in t.inorder()] == [20, 30, 40, 50, 60, 70, 80]      # en orden = ordenado
    assert t.preorder() == [50, 30, 20, 40, 70, 60, 80] and t.postorder() == [20, 40, 30, 60, 80, 70, 50]
    assert 40 in t and 45 not in t and t.get(60) == "60" and t.height() == 3 and len(t) == 7
    assert t.min() == (20, "20") and t.max() == (80, "80") and t.insert(50, "x") is False and t.get(50) == "x"

def test_bst_floor_ceiling_range():
    t = arbol()
    assert t.ceiling(41) == (50, "50") and t.ceiling(50) == (50, "50") and t.ceiling(81) is None
    assert t.floor(45) == (40, "40") and t.floor(19) is None and [k for k, _ in t.range(30, 60)] == [30, 40, 50, 60]

@pytest.mark.parametrize("clave", [20, 30, 50])  # hoja, un/dos hijos, raíz con dos hijos
def test_bst_delete_mantiene_el_orden(clave):
    t = arbol(); assert t.delete(clave) is True and clave not in t and len(t) == 6
    ks = [k for k, _ in t.inorder()]; assert ks == sorted(ks) and t.delete(999) is False

def test_bst_peor_caso_degenera():
    t = BST()
    for k in range(1, 11): t.insert(k)          # claves ya ordenadas
    assert t.height() == 10                      # el árbol queda como una lista: O(n)
