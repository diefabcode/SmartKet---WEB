from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import openpyxl


MEAL_SHEETS = ["Desayunos", "Comidas", "Cenas", "Colaciones"]


def _to_str_id(value: Any) -> str:
    """
    Convierte IDs que pueden venir como int/float/str a string limpio.
    Ej: 123456 -> "123456"
    """
    if value is None:
        return ""
    if isinstance(value, (int,)):
        return str(value)
    if isinstance(value, float):
        # Evita "123456.0"
        if value.is_integer():
            return str(int(value))
        return str(value)
    return str(value).strip()


def read_recipes_from_excel(excel_path: str) -> List[Dict[str, Any]]:
    wb = openpyxl.load_workbook(excel_path, data_only=True)

    recipes: List[Dict[str, Any]] = []

    for sheet_name in MEAL_SHEETS:
        if sheet_name not in wb.sheetnames:
            continue

        ws = wb[sheet_name]
        max_row = ws.max_row or 0

        row = 1
        while row <= max_row:
            tag = ws.cell(row, 1).value

            if tag == "Receta":
                title = ws.cell(row, 2).value
                rid = ws.cell(row, 3).value
                cals = ws.cell(row, 4).value

                recipe_id = _to_str_id(rid)
                recipe_title = (str(title).strip() if title is not None else "").strip()
                recipe_cals = float(cals) if isinstance(cals, (int, float)) else None

                # Preparaci n (fila siguiente esperada)
                prep_text = ""
                if row + 1 <= max_row and ws.cell(row + 1, 1).value == "Preparaci n":
                    prep_val = ws.cell(row + 1, 2).value
                    prep_text = (str(prep_val).strip() if prep_val is not None else "").strip()

                # Header de ingredientes (fila +2 esperada)
                ingredients: List[Dict[str, Any]] = []
                ing_row = row + 3  # datos empiezan 1 fila debajo del header
                # pero primero validamos que exista header en row+2
                if row + 2 <= max_row and ws.cell(row + 2, 1).value == "Ingrediente":
                    ing_row = row + 3

                    while ing_row <= max_row:
                        ing_name = ws.cell(ing_row, 1).value
                        if ing_name is None or str(ing_name).strip() == "":
                            break

                        unit = ws.cell(ing_row, 2).value
                        qty = ws.cell(ing_row, 3).value
                        forma = ws.cell(ing_row, 4).value
                        proceso = ws.cell(ing_row, 5).value

                        ingredients.append({
                            "name": str(ing_name).strip(),
                            "unit": (str(unit).strip() if unit is not None else ""),
                            "qty": qty,
                            "forma": (str(forma).strip() if forma is not None else ""),
                            "proceso": (str(proceso).strip() if proceso is not None else ""),
                        })
                        ing_row += 1

                # Construimos un DTO  compatible  con tu UI actual (con defaults)
                # Nota: img lo resolveremos en Paso 1.3, por ahora lo dejamos null.
                recipes.append({
                    "id": recipe_id,
                    "title": recipe_title,
                    "category": sheet_name[:-1] if sheet_name.endswith("s") else sheet_name,  # "Desayuno", etc.
                    "time": None,
                    "cals": recipe_cals,
                    "price": None,
                    "img": None,
                    "ingredients": ingredients,
                    "prep": prep_text
                })

                # Saltamos hasta despu s de la receta (buscamos primera fila vac a tras ingredientes)
                # Si no hubo ingredientes, avanzamos m nimo 1.
                row = max(row + 1, ing_row + 1)
                continue

            row += 1

    return recipes
