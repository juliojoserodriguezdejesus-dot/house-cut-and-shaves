"""Demostración en consola del Árbol Binario de Búsqueda con datos de la barbería:   python demo.py"""
from app.structures import BST

mins = lambda h: int(h[:2]) * 60 + int(h[3:])
print("=== ÁRBOL BINARIO DE BÚSQUEDA: horas ocupadas de Dayan (clave = minutos del día) ===")
t = BST()
for hora in ("10:00", "09:00", "12:00", "09:30", "11:00"):
    t.insert(mins(hora), hora); print(f"  insert {hora} ({mins(hora)}) -> tamaño {len(t)}, altura {t.height()}")
print("\n  Preorden :", t.preorder()); print("  Postorden:", t.postorder())
print("  En orden (agenda ordenada):", [v for _, v in t.inorder()])
print("\n  ¿Ocupada 10:30?", mins("10:30") in t, "| ¿ocupada 11:00?", mins("11:00") in t)
print("  Primera ocupada desde 10:15 (ceiling):", t.ceiling(mins("10:15"))[1], "| última ocupada hasta 10:15 (floor):", t.floor(mins("10:15"))[1])
print("  Citas entre 09:30 y 11:00:", [v for _, v in t.range(mins("09:30"), mins("11:00"))])
t.delete(mins("10:00")); print("\n  Cancelan la de 10:00 (nodo con dos hijos) -> en orden:", [v for _, v in t.inorder()], "| raíz nueva:", t.root.val)
peor = BST()
for m in range(1, 8): peor.insert(m)
print("\n  Peor caso: insertar 1..7 ya ordenados -> altura", peor.height(), "(una lista, O(n))")
