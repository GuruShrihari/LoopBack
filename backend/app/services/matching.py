from typing import List


def calculate_tag_overlap(source_tags: List[str], target_tags: List[str]) -> float:
    """
    Computes overlap fraction of target_tags covering source_tags.
    Formula: len(set(source_tags) & set(target_tags)) / len(set(source_tags))
    Guards against division by zero if source_tags is empty.
    """
    if not source_tags:
        return 0.0

    set_source = set(source_tags)
    set_target = set(target_tags) if target_tags else set()

    overlap = len(set_source & set_target)
    return float(overlap) / float(len(set_source))

