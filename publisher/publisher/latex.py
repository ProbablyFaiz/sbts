import re
import shutil
import subprocess
import tempfile
from enum import StrEnum
from pathlib import Path
from typing import Any


class LatexTemplate(StrEnum):
    BALLOT = "ballot"


_NAMC_LOGO_PATH = Path("templates/namc_logo.pdf")
_TEMPLATE_PATHS: dict[LatexTemplate, Path] = {
    LatexTemplate.BALLOT: Path("templates/ballot.tex"),
}


def get_template(template: LatexTemplate) -> str:
    return _TEMPLATE_PATHS[template].read_text()


def escape_tex(text: str) -> str:
    """
    :param text: a plain text message
    :return: the message escaped to appear correctly in LaTeX
    """
    conv = {
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_",
        "{": r"\{",
        "}": r"\}",
        "~": r"\textasciitilde{}",
        "^": r"\^{}",
        "\\": r"\textbackslash{}",
        "<": r"\textless{}",
        ">": r"\textgreater{}",
    }
    escape_pattern = re.compile(
        "|".join(
            re.escape(str(key))
            for key in sorted(conv.keys(), key=lambda item: -len(item))
        )
    )
    return escape_pattern.sub(lambda match: conv[match.group()], text)


def render_template(template: LatexTemplate, fields: dict[str, Any]) -> str:
    # TODO: Use jinja or something if we ever need more advanced templating
    template_str = get_template(template)
    replacements = [
        (f"{{ {key} }}", escape_tex(value)) for key, value in fields.items()
    ]
    for old, new in replacements:
        template_str = template_str.replace(old, new)
    return template_str


def compile_latex(latex_str: str) -> bytes:
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_dir = Path(temp_dir)
        tex_file = temp_dir / "temp.tex"
        tex_file.write_text(latex_str)
        shutil.copy(_NAMC_LOGO_PATH, temp_dir / "namc_logo.pdf")
        subprocess.run(["pdflatex", tex_file], cwd=temp_dir)
        return tex_file.with_suffix(".pdf").read_bytes()


def create_pdf_from_template(template: LatexTemplate, fields: dict[str, Any]) -> bytes:
    latex_str = render_template(template, fields)
    return compile_latex(latex_str)
