from typing import List, Dict, Any

def paginate_results(items: List[Dict[str, Any]], page: int = 1, per_page: int = 10) -> Dict[str, Any]:
    """Pagine une liste de résultats."""
    total = len(items)
    total_pages = (total + per_page - 1) // per_page
    
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    
    return {
        'items': items[start_idx:end_idx],
        'total': total,
        'pages': total_pages,
        'current_page': page
    } 