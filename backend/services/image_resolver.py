import os
from typing import Dict, Optional, Tuple

# Extensiones soportadas (en orden de prioridad)
IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"]


def _is_image(filename: str) -> bool:
    _, ext = os.path.splitext(filename)
    return ext.lower() in IMAGE_EXTS


def build_image_index(resources_dir: str) -> Dict[str, str]:
    """
    Indexa todas las imágenes bajo resources_dir (recursivo), ignorando subcarpetas.
    Regresa dict: { "123456": "C:/.../Recursos/Desayunos/123456.jpeg", ... }
    Si hay duplicados del mismo ID en distintas carpetas, se queda con el primero encontrado.
    """
    index: Dict[str, str] = {}

    if not resources_dir or not os.path.isdir(resources_dir):
        return index

    for root, _, files in os.walk(resources_dir):
        for f in files:
            if not _is_image(f):
                continue

            name, _ext = os.path.splitext(f)
            rid = str(name).strip()
            if not rid:
                continue

            # Solo guardamos el primero que encontremos para ese ID
            if rid not in index:
                index[rid] = os.path.join(root, f)

    return index


def resolve_image_path(resources_dir: str, recipe_id: str) -> Optional[str]:
    """
    Busca recursivamente el archivo de imagen cuyo nombre sea exactamente = recipe_id
    (sin importar subcarpeta). Regresa ruta completa o None.
    """
    if not recipe_id:
        return None

    recipe_id = str(recipe_id).strip()
    if not recipe_id:
        return None

    # Búsqueda simple (recursiva) por match exacto de nombre
    if not resources_dir or not os.path.isdir(resources_dir):
        return None

    for root, _, files in os.walk(resources_dir):
        for f in files:
            if not _is_image(f):
                continue

            name, _ext = os.path.splitext(f)
            if str(name).strip() == recipe_id:
                return os.path.join(root, f)

    return None
