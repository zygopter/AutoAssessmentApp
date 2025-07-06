import React, { useState } from 'react'
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter
} from "./ui/card"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from "./ui/accordion"
import { Spinner } from "./ui/spinner"
import { ErrorBanner } from './ui/error-banner'
import { useCompetences } from '../contexts/CompetencesContext'
import toast from 'react-hot-toast'

const CompetencesTab = () => {
  const {
    categories,
    addCategory,
    updateCategoryById,
    deleteCategoryById,
    addCompetence,
    updateCompetenceById,
    deleteCompetenceById,
    isLoading,
    error
  } = useCompetences()

  const [newCategory, setNewCategory] = useState({ name: '', description: '' })
  const [newCompetence, setNewCompetence] = useState({
    name: '',
    description: '',
    categoryId: null,
    controlPoints: ['']
  })
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingCompetence, setEditingCompetence] = useState(null)

  const handleAddCategory = async () => {
    if (!newCategory.name) return
    try {
      await addCategory(newCategory)
      setNewCategory({ name: '', description: '' })
      toast.success("Catégorie ajoutée avec succès")
    } catch (err) {
      toast.error(`Erreur lors de l'ajout de la catégorie: ${err.message}`)
    }
  }

  const handleUpdateCategory = async (id) => {
    try {
      await updateCategoryById(id, editingCategory)
      setEditingCategory(null)
      toast.success("Catégorie mise à jour avec succès")
    } catch (err) {
      toast.error(`Erreur lors de la mise à jour de la catégorie: ${err.message}`)
    }
  }

  const handleDeleteCategory = async (id) => {
    try {
      await deleteCategoryById(id)
      toast.success("Catégorie supprimée avec succès")
    } catch (err) {
      toast.error(`Erreur lors de la suppression de la catégorie: ${err.message}`)
    }
  }

  const handleAddCompetence = async () => {
    const { name, description, categoryId, controlPoints } = newCompetence
    if (!name || !categoryId) return
    try {
      await addCompetence(newCompetence)
      setNewCompetence({
        name: '',
        description: '',
        categoryId: null,
        controlPoints: ['']
      })
      toast.success("Compétence ajoutée avec succès")
    } catch (err) {
      toast.error(`Erreur lors de l'ajout de la compétence: ${err.message}`)
    }
  }

  const handleUpdateCompetence = async (id) => {
    try {
      await updateCompetenceById(id, editingCompetence)
      setEditingCompetence(null)
      toast.success("Compétence mise à jour avec succès")
    } catch (err) {
      toast.error(`Erreur lors de la mise à jour de la compétence: ${err.message}`)
    }
  }

  const handleDeleteCompetence = async (id, categoryId) => {
    try {
      await deleteCompetenceById(id, categoryId)
      toast.success("Compétence supprimée avec succès")
    } catch (err) {
      toast.error(`Erreur lors de la suppression de la compétence: ${err.message}`)
    }
  }

  const onChangeNewPoint = idx => e => {
    const pts = [...newCompetence.controlPoints]
    pts[idx] = e.target.value
    setNewCompetence(c => ({ ...c, controlPoints: pts }))
  }

  const addNewPoint = () => {
    setNewCompetence(c => ({
      ...c,
      controlPoints: [...c.controlPoints, '']
    }))
  }

  const onChangeEditPoint = idx => e => {
    const pts = [...editingCompetence.controlPoints]
    pts[idx] = e.target.value
    setEditingCompetence(c => ({ ...c, controlPoints: pts }))
  }

  const addEditPoint = () => {
    setEditingCompetence(c => ({
      ...c,
      controlPoints: [...c.controlPoints, '']
    }))
  }

  if (isLoading) return <Spinner />
  if (error) return <ErrorBanner message={error} />

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Gestion des compétences</h2>

      {/* Ajout de catégorie */}
      <Card>
        <CardHeader><CardTitle>Ajouter une nouvelle catégorie</CardTitle></CardHeader>
        <CardContent>
          <Input
            className="mb-2"
            placeholder="Nom de la catégorie"
            value={newCategory.name}
            onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
          />
          <Textarea
            className="mb-2"
            placeholder="Description de la catégorie"
            value={newCategory.description}
            onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
          />
        </CardContent>
        <CardFooter>
          <Button onClick={handleAddCategory}>Ajouter la catégorie</Button>
        </CardFooter>
      </Card>

      {/* Liste catégories & compétences */}
      {categories.length > 0 ? (
        <Accordion type="single" collapsible className="w-full space-y-2">
          {categories.map(category => (
            <AccordionItem
              key={category.id}
              value={`category-${category.id}`}
              className="border rounded-lg p-4"
            >
              <AccordionTrigger className="text-lg font-semibold">
                {category.name}
              </AccordionTrigger>
              <AccordionContent>
                <div className="mt-2 space-y-4">
                  {/* Édition catégorie */}
                  {editingCategory?.id === category.id ? (
                    <Card>
                      <CardContent className="pt-4">
                        <Input
                          className="mb-2"
                          value={editingCategory.name}
                          onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        />
                        <Textarea
                          className="mb-2"
                          value={editingCategory.description}
                          onChange={e => setEditingCategory({ ...editingCategory, description: e.target.value })}
                        />
                      </CardContent>
                      <CardFooter className="space-x-2">
                        <Button onClick={() => handleUpdateCategory(category.id)}>Sauvegarder</Button>
                        <Button variant="outline" onClick={() => setEditingCategory(null)}>Annuler</Button>
                      </CardFooter>
                    </Card>
                  ) : (
                    <div>
                      <p className="mb-2">{category.description}</p>
                      <div className="space-x-2">
                        <Button variant="outline" onClick={() => setEditingCategory(category)}>Modifier</Button>
                        <Button variant="destructive" onClick={() => handleDeleteCategory(category.id)}>Supprimer</Button>
                      </div>
                    </div>
                  )}

                  {/* Liste des compétences */}
                  <div className="mt-4">
                    <h3 className="text-md font-semibold mb-2">Compétences</h3>
                    {category.competences.length > 0 ? (
                      <ul className="space-y-4">
                        {category.competences.map(competence => (
                          <li key={competence.id} className="border rounded p-4">
                            {editingCompetence?.id === competence.id ? (
                              <Card>
                                <CardContent className="pt-4">
                                  <Input
                                    className="mb-2"
                                    value={editingCompetence.name}
                                    onChange={e => setEditingCompetence({ ...editingCompetence, name: e.target.value })}
                                  />
                                  <Textarea
                                    className="mb-2"
                                    value={editingCompetence.description}
                                    onChange={e => setEditingCompetence({ ...editingCompetence, description: e.target.value })}
                                  />
                                  <div className="mt-2">
                                    <label className="font-medium">Points de contrôle</label>
                                    {editingCompetence.controlPoints.map((pt, i) => (
                                      <Input
                                        key={i}
                                        className="mb-2"
                                        value={pt}
                                        onChange={onChangeEditPoint(i)}
                                        placeholder={`Point #${i+1}`}
                                      />
                                    ))}
                                    <Button size="sm" onClick={addEditPoint}>+ Ajouter un point</Button>
                                  </div>
                                </CardContent>
                                <CardFooter className="space-x-2">
                                  <Button onClick={() => handleUpdateCompetence(competence.id)}>Sauvegarder</Button>
                                  <Button variant="outline" onClick={() => setEditingCompetence(null)}>Annuler</Button>
                                </CardFooter>
                              </Card>
                            ) : (
                              <div>
                                <strong>{competence.name}</strong>
                                <p className="mt-2 whitespace-pre-wrap">{competence.description}</p>
                                <ul className="list-decimal ml-6 mt-2 text-sm text-gray-700">
                                  {competence.controlPoints.length > 0
                                    ? competence.controlPoints.map((pt, i) => <li key={i}>{pt}</li>)
                                    : <li><em>(aucun point de contrôle défini)</em></li>
                                  }
                                </ul>
                                <div className="mt-2 space-x-2">
                                  <Button size="sm" variant="outline" onClick={() => setEditingCompetence(competence)}>Modifier</Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleDeleteCompetence(competence.id, category.id)}>Supprimer</Button>
                                </div>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 italic">Aucune compétence pour cette catégorie.</p>
                    )}
                  </div>

                  {/* Formulaire d'ajout de compétence */}
                  <Card>
                    <CardHeader><CardTitle>Ajouter une nouvelle compétence</CardTitle></CardHeader>
                    <CardContent>
                      <Input
                        className="mb-2"
                        placeholder="Nom de la compétence"
                        value={newCompetence.name}
                        onChange={e => setNewCompetence({
                          ...newCompetence,
                          name: e.target.value,
                          categoryId: category.id
                        })}
                      />
                      <Textarea
                        className="mb-2"
                        placeholder="Description de la compétence"
                        value={newCompetence.description}
                        onChange={e => setNewCompetence({
                          ...newCompetence,
                          description: e.target.value,
                          categoryId: category.id
                        })}
                      />
                      <div className="mt-2">
                        <label className="font-medium">Points de contrôle</label>
                        {newCompetence.controlPoints.map((pt, i) => (
                          <Input
                            key={i}
                            className="mb-2"
                            value={pt}
                            onChange={onChangeNewPoint(i)}
                            placeholder={`Point #${i+1}`}
                          />
                        ))}
                        <Button size="sm" onClick={addNewPoint}>+ Ajouter un point</Button>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={handleAddCompetence}>Ajouter la compétence</Button>
                    </CardFooter>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <p className="text-gray-500 italic">Aucune catégorie trouvée.</p>
      )}
    </div>
  )
}

export default CompetencesTab
