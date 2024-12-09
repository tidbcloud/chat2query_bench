import { TaskTreeNode } from "~/server/api";

export function getAllLeafTaskNodes(
  map: Record<string, TaskTreeNode>,
): TaskTreeNode[] {
  const leaves: TaskTreeNode[] = [];

  // Recursively traverse the tree
  function traverse(node: TaskTreeNode) {
    if (!node.sub_task_list || node.sub_task_list.length === 0) {
      // If the node has no children, it's a leaf node
      leaves.push(node);
    } else {
      // If the node has children, traverse them in depth-first order
      for (let i = 0; i < node.sub_task_list.length; i++) {
        const id = node.sub_task_list[i];
        traverse(map[id]);
      }
    }
  }

  // Start the traversal at the root node
  traverse(map["0"]);

  return leaves;
}

interface TreeNodeLike {
  id: string;
  children?: TreeNodeLike[];
}

export function searchTree(
  root: TreeNodeLike,
  target: string,
): { node: TreeNodeLike | null; parent: TreeNodeLike | null } {
  if (root === null) {
    return { node: null, parent: null }; // If the root is null, the tree is empty
  }

  if (root.id === target) {
    return { node: root, parent: null }; // If the current node has the target value, return it with null parent
  }

  // Recursively search the children
  if (root.children) {
    for (let i = 0; i < root.children.length; i++) {
      const child = root.children[i];
      if (child.id === target) {
        return { node: child, parent: root }; // If the target is found in a child node, return it with the parent node
      }

      const { node, parent } = searchTree(child, target);
      if (node !== null) {
        return { node, parent }; // If the target is found in the child's subtree, return it with the parent node
      }
    }
  }

  return { node: null, parent: null }; // If the target is not found in the tree, return null nodes
}
